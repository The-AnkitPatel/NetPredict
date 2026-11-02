build_api <- function(service = new_service()) {
  api <- plumber::pr()
  collector <- new_collector()
  origins <- trimws(strsplit(Sys.getenv("CORS_ORIGINS", ""), ",", fixed = TRUE)[[1]])
  api <- plumber::pr_filter(api, "cors", function(req, res) {
    origin <- req$HTTP_ORIGIN %||% ""
    if (nzchar(origin) && origin %in% origins) {
      res$setHeader("Access-Control-Allow-Origin", origin)
      res$setHeader("Vary", "Origin")
      res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      res$setHeader("Access-Control-Allow-Headers", "Content-Type")
    }
    if (identical(req$REQUEST_METHOD, "OPTIONS")) {
      res$status <- if (origin %in% origins) 204L else 403L
      return(NULL)
    }
    plumber::forward()
  })
  api <- plumber::pr_set_serializer(api, plumber::serializer_json(auto_unbox = TRUE, na = "null", digits = 8))
  api <- plumber::pr_set_error(api, function(req, res, err) {
    message(conditionMessage(err))
    res$status <- if (grepl("No telemetry|not found", conditionMessage(err))) 404L else 422L
    list(detail = conditionMessage(err))
  })
  add <- function(method, path, handler) {
    api <<- plumber::pr_handle(api, method, path, handler)
  }
  add("GET", "/", function() list(service = "NetPredict R", version = "2.0.0", api_v1 = "/api/v1", docs = "/__docs__/"))
  add("GET", "/api/v1/health", function() list(status = "HEALTHY", system = "NetPredict R", version = "2.0.0",
    is_model_trained = TRUE, is_explainer_ready = TRUE, is_conformal_calibrated = TRUE))
  add("GET", "/api/v1/health/model", function() {
    health <- service$system$health
    health$evaluation_metrics <- lapply(health$evaluation_metrics, round, digits = 4)
    health$baseline_comparison <- lapply(health$baseline_comparison, function(metrics) lapply(metrics, round, digits = 4))
    bins <- health$calibration_curve
    health$calibration_curve <- list(
      bin_predicted_probs = unname(lapply(bins, function(bin) bin$mean_predicted_probability)),
      bin_true_fractions = unname(lapply(bins, function(bin) bin$fraction_positive)))
    health
  })
  add("POST", "/api/v1/health/recalibrate", function() recalibrate_system(service))
  add("POST", "/api/v1/telemetry/ingest", function(req) {
    body <- jsonlite::fromJSON(req$postBody, simplifyVector = FALSE)
    count <- ingest_records(service$windows, body$records)
    list(status = "ok", ingested_count = count)
  })
  add("GET", "/api/v1/telemetry/latest", function(device_id = "core-router-alpha", interface_id = "xe-0/0/1") {
    row <- tail(window_history(service$windows, device_id, interface_id), 1)
    list(telemetry = as.list(transform(row, timestamp = utc_time(timestamp))), anomaly = anomaly_score(service$system, row))
  })
  add("GET", "/api/v1/telemetry/history", function(device_id = "core-router-alpha", interface_id = "xe-0/0/1", limit = 60) {
    rows <- window_history(service$windows, device_id, interface_id, as.numeric(limit))
    transform(rows, timestamp = utc_time(timestamp))
  })
  for (action in c("step", "reset", "jump-incident")) local({
    mode <- action
    add("POST", paste0("/api/v1/telemetry/stream/", mode), function() step_stream(service, mode))
  })
  add("POST", "/api/v1/telemetry/live-poll", function(capacity_mbps = 1000) collect_live(collector, as.numeric(capacity_mbps)))
  add("GET", "/api/v1/predict/horizons", function(device_id = "core-router-alpha", interface_id = "xe-0/0/1") predict_latest(service, device_id, interface_id))
  add("GET", "/api/v1/predict/incidents", function() unname(service$incidents))
  add("GET", "/api/v1/explain/latest", function(device_id = "core-router-alpha", interface_id = "xe-0/0/1") {
    explain_features(service$system, latest_features(window_history(service$windows, device_id, interface_id)))
  })
  add("GET", "/api/v1/explain/<prediction_id>", function(prediction_id) {
    cached <- service$cache[[prediction_id]]
    if (is.null(cached)) stop("Prediction not found in cache")
    explain_features(service$system, cached$features, prediction_id = prediction_id)
  })
  add("POST", "/api/v1/simulate", function(req) simulate_scenario(service, jsonlite::fromJSON(req$postBody, simplifyVector = FALSE)))
  add("POST", "/api/v1/simulate/prescribe", function(device_id = "core-router-alpha", interface_id = "xe-0/0/1", horizon_minutes = 15) {
    prescribe_scenario(service, device_id, interface_id, as.numeric(horizon_minutes))
  })
  api
}
