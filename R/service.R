new_service <- function(system = load_system(), trace = load_trace()) {
  e <- new.env(parent = emptyenv())
  e$system <- system; e$trace <- trace; e$windows <- new_windows()
  e$cursor <- 45L; e$sequence <- 0L; e$cache <- list(); e$incidents <- list()
  ingest_records(e$windows, trace[seq_len(e$cursor), ])
  e
}
predict_latest <- function(service, device = "core-router-alpha", interface = "xe-0/0/1") {
  history <- window_history(service$windows, device, interface)
  features <- latest_features(history); record <- tail(history, 1)
  preds <- lapply(horizons, function(h) predict_horizon(service$system, features, h))
  names(preds) <- as.character(horizons)
  anomaly <- anomaly_score(service$system, record)
  service$sequence <- service$sequence + 1L
  id <- paste0("P-", service$sequence)
  primary <- preds[["15"]]
  prediction <- list(prediction_id = id, timestamp = utc_time(record$timestamp), device_id = device, interface_id = interface,
    current_anomaly_score = anomaly$anomaly_score, is_current_anomaly = anomaly$is_anomaly,
    anomaly_status = anomaly$status, horizons = preds, primary_horizon = primary,
    recommended_action = if (primary$risk_level == "LOW") "Continue monitoring" else "Inspect queue pressure and compare mitigation scenarios",
    primary_drivers = character())
  service$cache[[id]] <- list(prediction = prediction, features = features)
  service$cache <- tail(service$cache, 500)
  prediction
}
record_incident <- function(service, prediction) {
  if (prediction$primary_horizon$calibrated_probability < .7) return(invisible(NULL))
  id <- paste(prediction$device_id, prediction$interface_id, prediction$timestamp, sep = "|")
  service$incidents[[id]] <- list(incident_id = id, timestamp = prediction$timestamp,
    device_id = prediction$device_id, interface_id = prediction$interface_id, failure_type = "CONGESTION_RISK",
    predicted_risk = prediction$primary_horizon$calibrated_probability, actual_outcome = "PENDING",
    lead_time_minutes = 15L, was_prevented = NA, root_cause_driver = "Await feature explanation")
  service$incidents <- tail(service$incidents, 500)
}
resolve_incidents <- function(service, record) {
  for (key in names(service$incidents)) {
    incident <- service$incidents[[key]]
    if (incident$actual_outcome != "PENDING" || incident$device_id != record$device_id || incident$interface_id != record$interface_id) next
    elapsed <- as.numeric(difftime(record$timestamp, parse_time(incident$timestamp), units = "mins"))
    if (elapsed == 15) service$incidents[[key]]$actual_outcome <- if (with(record, queue_occupancy_pct > 80 | packet_loss_pct > 1.5 | rtt_ms > 65)) "FAILURE_OBSERVED" else "NO_FAILURE_OBSERVED"
    if (elapsed > 15) service$incidents[[key]]$actual_outcome <- "TARGET_SAMPLE_MISSING"
  }
}
step_stream <- function(service, action = "step") {
  if (action == "reset" || (action == "step" && service$cursor >= nrow(service$trace))) {
    service$windows <- new_windows(); service$cache <- list(); service$incidents <- list(); service$cursor <- 45L
    ingest_records(service$windows, service$trace[1:45, ])
  } else if (action == "jump-incident") {
    severe <- which(service$trace$queue_occupancy_pct > 85)
    if (!length(severe)) stop("No incident exists in this trace")
    target <- severe[1]
    service$windows <- new_windows(); service$cache <- list(); service$incidents <- list()
    service$cursor <- max(30L, target - 1L)
    ingest_records(service$windows, service$trace[max(1, service$cursor - 719):service$cursor, ])
  } else if (action != "step") stop("Unknown stream action")
  service$cursor <- service$cursor + 1L
  record <- service$trace[service$cursor, ]
  ingest_records(service$windows, record)
  resolve_incidents(service, record)
  pred <- predict_latest(service, record$device_id, record$interface_id)
  record_incident(service, pred)
  list(record = as.list(transform(record, timestamp = utc_time(timestamp))), prediction = pred,
    progress = list(current_step = service$cursor, total_steps = nrow(service$trace), is_playing = FALSE, playback_speed = 1))
}
recalibrate_system <- function(service) {
  # Only the original, disjoint calibration fold; do not train on held-out test labels.
  x <- extract_features(service$trace); ca <- service$system$split$calibration
  for (h in horizons) {
    key <- as.character(h); model <- service$system$models[[key]]; y <- future_targets(service$trace, h)
    model$calibration <- fit_isotonic(forest_predict(model$classifier, x[ca, ]), y$failure[ca])
    model$rtt_quantile <- conformal_quantile(y$rtt[ca], forest_predict(model$rtt, x[ca, ]))
    service$system$models[[key]] <- model
  }
  list(status = "RECALIBRATED", source = "Original held-out calibration fold", samples = length(ca))
}
