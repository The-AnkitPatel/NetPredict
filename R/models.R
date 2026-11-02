fit_isotonic <- function(p, y) {
  # Collapse tied probabilities, then weighted pool-adjacent-violators.
  x <- sort(unique(p))
  weight <- vapply(x, function(v) sum(p == v), numeric(1))
  value <- vapply(x, function(v) mean(y[p == v]), numeric(1))
  blocks <- lapply(seq_along(x), function(i) list(idx = i, w = weight[i], v = value[i]))
  i <- 1L
  while (i < length(blocks)) {
    if (blocks[[i]]$v > blocks[[i + 1L]]$v) {
      a <- blocks[[i]]; b <- blocks[[i + 1L]]
      blocks[[i]] <- list(idx = c(a$idx, b$idx), w = a$w + b$w, v = (a$w * a$v + b$w * b$v) / (a$w + b$w))
      blocks[[i + 1L]] <- NULL
      i <- max(1L, i - 1L)
    } else i <- i + 1L
  }
  for (block in blocks) value[block$idx] <- block$v
  list(x = x, y = value)
}
calibrate_prob <- function(cal, p) {
  if (length(cal$x) == 1) return(rep(cal$y, length(p)))
  clamp(approx(cal$x, cal$y, xout = p, rule = 2, ties = "ordered")$y, 0, 1)
}
conformal_quantile <- function(actual, predicted, alpha = .1) {
  scores <- sort(abs(actual - predicted))
  scores[min(length(scores), ceiling((length(scores) + 1) * (1 - alpha)))]
}
forest_predict <- function(model, x) {
  if (!requireNamespace("ranger", quietly = TRUE)) stop("Install ranger with scripts/setup.R")
  p <- predict(model, data = x, num.threads = 1)$predictions
  if (is.matrix(p)) unname(p[, "1"]) else as.numeric(p)
}
binary_metrics <- function(y, p) {
  positive <- p >= .5
  tp <- sum(positive & y == 1); fp <- sum(positive & y == 0); fn <- sum(!positive & y == 1)
  precision <- tp / max(1, tp + fp); recall <- tp / max(1, tp + fn)
  n1 <- sum(y == 1); n0 <- sum(y == 0)
  auc <- if (n1 * n0 > 0) (sum(rank(p)[y == 1]) - n1 * (n1 + 1) / 2) / (n1 * n0) else NA_real_
  list(accuracy = mean(positive == y), precision = precision, recall = recall,
    f1 = 2 * precision * recall / max(1e-12, precision + recall), roc_auc = auc, brier_score = mean((p - y)^2))
}
psi <- function(reference, current) {
  breaks <- unique(c(-Inf, quantile(reference, seq(.1, .9, .1)), Inf))
  a <- pmax(as.numeric(table(cut(reference, breaks))) / length(reference), 1e-6)
  b <- pmax(as.numeric(table(cut(current, breaks))) / length(current), 1e-6)
  sum((b - a) * log(b / a))
}
train_system <- function(trace = load_trace(), trees = 120L) {
  x <- extract_features(trace); split <- temporal_split(nrow(trace))
  tr <- split$train; ca <- split$calibration; te <- split$test
  fit <- function(y, classification = FALSE) {
    ranger::ranger(x = x[tr, ], y = if (classification) factor(y[tr], levels = c(0, 1)) else y[tr],
      probability = classification, num.trees = trees, min.node.size = 10,
      seed = 42, num.threads = 1, importance = "impurity")
  }
  models <- lapply(horizons, function(h) {
    y <- future_targets(trace, h)
    classifier <- fit(y$failure, TRUE)
    rtt <- fit(y$rtt); loss <- fit(y$loss)
    calibration <- fit_isotonic(forest_predict(classifier, x[ca, ]), y$failure[ca])
    q <- conformal_quantile(y$rtt[ca], forest_predict(rtt, x[ca, ]))
    p <- calibrate_prob(calibration, forest_predict(classifier, x[te, ]))
    r <- forest_predict(rtt, x[te, ])
    list(classifier = classifier, rtt = rtt, loss = loss, calibration = calibration, rtt_quantile = q,
      metrics = c(binary_metrics(y$failure[te], p), list(rtt_mae = mean(abs(r - y$rtt[te])),
        rtt_interval_coverage = mean(abs(r - y$rtt[te]) <= q))))
  })
  names(models) <- as.character(horizons)
  # Store training data for rebuilding the native isolation-forest pointer after reload.
  anomaly_reference <- trace[tr, raw_fields]
  set.seed(42)
  background <- x[sample(tr, min(32L, length(tr))), , drop = FALSE]
  y <- future_targets(trace, 15)$failure
  # Small, interpretable logistic baseline; fit on the same purged training fold.
  baseline_columns <- c("queue_mean_5m", "rtt_mean_5m", "util_mean_15m", "queue_slope_5m")
  lr <- suppressWarnings(glm(y ~ ., data = data.frame(y = y[tr], x[tr, baseline_columns]), family = binomial()))
  lp <- suppressWarnings(as.numeric(predict(lr, newdata = x[te, baseline_columns], type = "response")))
  b <- list(random_forest_calibrated = models[["15"]]$metrics,
    logistic_regression = binary_metrics(y[te], lp),
    moving_average_threshold = binary_metrics(y[te], as.numeric(x$queue_mean_5m[te] > 80 | x$rtt_mean_5m[te] > 65)),
    naive_persistence = binary_metrics(y[te], as.numeric(trace$queue_occupancy_pct[te] > 80 | trace$packet_loss_pct[te] > 1.5 | trace$rtt_ms[te] > 65)))
  p <- calibrate_prob(models[["15"]]$calibration, forest_predict(models[["15"]]$classifier, x[te, ]))
  groups <- split(seq_along(p), cut(p, breaks = seq(0, 1, .1), include.lowest = TRUE))
  curve <- lapply(groups[lengths(groups) > 0], function(i) list(mean_predicted_probability = mean(p[i]), fraction_positive = mean(y[te][i]), count = length(i)))
  drift <- c(queue_occupancy_psi = psi(x$queue_occupancy_pct[tr], x$queue_occupancy_pct[te]), rtt_psi = psi(x$rtt_ms[tr], x$rtt_ms[te]))
  system <- list(version = 2L, feature_names = names(x), models = models, background = background,
    anomaly_reference = anomaly_reference, split = split,
    training_fingerprint = unname(tools::md5sum("data/telemetry_trace.csv")),
    health = list(model_type = "R ranger probability forests + isotonic calibration",
      evaluation_metrics = models[["15"]]$metrics, calibration_curve = unname(curve),
      baseline_comparison = b, drift_monitoring = c(as.list(drift), list(status = if (max(drift) >= .25) "SIGNIFICANT_DRIFT_ALERT" else if (max(drift) >= .1) "MODERATE_SHIFT" else "STABLE"))))
  attach_anomaly(system)
}
attach_anomaly <- function(system) {
  system$anomaly <- isotree::isolation.forest(system$anomaly_reference, ntrees = 100,
    sample_size = min(256, nrow(system$anomaly_reference)), ndim = 1, nthreads = 1, seed = 42)
  system
}
save_system <- function(system, path = "models/netpredict.rds") {
  dir.create(dirname(path), recursive = TRUE, showWarnings = FALSE)
  system$anomaly <- NULL
  saveRDS(system, path)
  invisible(path)
}
load_system <- function(path = "models/netpredict.rds", trace = load_trace()) {
  if (file.exists(path)) {
    system <- readRDS(path)
    fingerprint <- unname(tools::md5sum("data/telemetry_trace.csv"))
    if (identical(system$version, 2L) && identical(system$training_fingerprint, fingerprint)) return(attach_anomaly(system))
  }
  system <- train_system(trace)
  save_system(system, path)
  system
}
predict_horizon <- function(system, features, horizon = 15L) {
  if (!horizon %in% horizons) stop("horizon_minutes must be 5, 15 or 30")
  model <- system$models[[as.character(horizon)]]
  raw <- forest_predict(model$classifier, features)
  p <- calibrate_prob(model$calibration, raw)
  rtt <- pmax(0, forest_predict(model$rtt, features))
  list(horizon_minutes = horizon, failure_risk_score = raw, calibrated_probability = p,
    risk_level = if (p < .35) "LOW" else if (p < .7) "ELEVATED" else "CRITICAL",
    predicted_rtt_ms = rtt, predicted_packet_loss_pct = clamp(forest_predict(model$loss, features)),
    conformal_lower_bound_rtt = pmax(0, rtt - model$rtt_quantile), conformal_upper_bound_rtt = rtt + model$rtt_quantile)
}
anomaly_score <- function(system, record) {
  score <- as.numeric(predict(system$anomaly, record[raw_fields], type = "score", nthreads = 1))
  list(anomaly_score = score, is_anomaly = score >= .65,
    status = if (score >= .65) "Present telemetry anomaly" else "Normal baseline behavior")
}
explain_features <- function(system, features, horizon = 15L, permutations = 24L, prediction_id = "LATEST") {
  if (!horizon %in% horizons) stop("Unsupported horizon")
  # Monte Carlo interventional Shapley values on RAW probability, not TreeSHAP.
  # Each permutation telescopes exactly from its background row to the sample.
  set.seed(42)
  columns <- names(features); m <- length(columns)
  paths <- vector("list", permutations); orders <- vector("list", permutations)
  for (k in seq_len(permutations)) {
    orders[[k]] <- sample.int(m)
    row <- system$background[(k - 1) %% nrow(system$background) + 1L, , drop = FALSE]
    path <- row[rep(1, m + 1L), , drop = FALSE]
    for (j in seq_len(m)) {
      row[[columns[orders[[k]][j]]]] <- features[[columns[orders[[k]][j]]]]
      path[j + 1L, ] <- row
    }
    paths[[k]] <- path
  }
  probs <- matrix(forest_predict(system$models[[as.character(horizon)]]$classifier, do.call(rbind, paths)), nrow = m + 1)
  values <- numeric(m)
  for (k in seq_len(permutations)) values[orders[[k]]] <- values[orders[[k]]] + diff(probs[, k]) / permutations
  total <- max(1e-12, sum(abs(values)))
  attrs <- lapply(order(abs(values), decreasing = TRUE), function(i) list(feature_name = columns[i],
    feature_value = features[[columns[i]]], shap_value = values[i], contribution_pct = abs(values[i]) / total * 100,
    impact_direction = if (values[i] >= 0) "INCREASES_RISK" else "DECREASES_RISK",
    diagnostic_description = paste(columns[i], "contributes", round(values[i], 4), "raw probability points")))
  pred <- predict_horizon(system, features, horizon)
  list(prediction_id = prediction_id, horizon_minutes = horizon, method = "Permutation Shapley (approximate, raw probability)",
    base_value = mean(probs[1, ]), predicted_risk = pred$failure_risk_score, calibrated_risk = pred$calibrated_probability,
    all_attributions = attrs, top_risk_drivers = head(Filter(function(a) a$shap_value > 0, attrs), 5),
    top_protective_factors = head(Filter(function(a) a$shap_value < 0, attrs), 5),
    operator_summary = "Associational model explanation; correlated features and approximation affect attribution.")
}
