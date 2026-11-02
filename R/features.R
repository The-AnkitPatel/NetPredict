rolling <- function(x, width, fun) vapply(seq_along(x), function(i) fun(x[max(1, i - width + 1):i]), numeric(1))
safe_sd <- function(x) if (length(x) < 2) 0 else sd(x)
ewma <- function(x, alpha = .2) {
  if (!length(x)) return(numeric())
  y <- x
  if (length(x) > 1) for (i in 2:length(x)) y[i] <- alpha * x[i] + (1 - alpha) * y[i - 1]
  y
}
lag_slope <- function(x, lag = 5L) {
  y <- numeric(length(x))
  if (length(x) > lag) y[(lag + 1):length(x)] <- (x[(lag + 1):length(x)] - x[1:(length(x) - lag)]) / lag
  y
}
extract_features <- function(x) {
  f <- x[raw_fields]
  f$rtt_mean_5m <- rolling(x$rtt_ms, 5, mean)
  f$rtt_std_5m <- rolling(x$rtt_ms, 5, safe_sd)
  f$queue_mean_5m <- rolling(x$queue_occupancy_pct, 5, mean)
  f$queue_max_5m <- rolling(x$queue_occupancy_pct, 5, max)
  f$loss_max_5m <- rolling(x$packet_loss_pct, 5, max)
  f$util_mean_15m <- rolling(x$bandwidth_util_pct, 15, mean)
  f$rtt_mean_15m <- rolling(x$rtt_ms, 15, mean)
  f$queue_mean_15m <- rolling(x$queue_occupancy_pct, 15, mean)
  f$queue_std_15m <- rolling(x$queue_occupancy_pct, 15, safe_sd)
  f$discards_sum_15m <- rolling(x$interface_discards_sec, 15, sum)
  f$rtt_slope_5m <- lag_slope(x$rtt_ms)
  f$queue_slope_5m <- lag_slope(x$queue_occupancy_pct)
  f$util_slope_5m <- lag_slope(x$bandwidth_util_pct)
  f$rtt_ewma <- ewma(x$rtt_ms)
  f$queue_ewma <- ewma(x$queue_occupancy_pct)
  f$buffer_stress_index <- x$queue_occupancy_pct * x$bandwidth_util_pct / 100
  f$congestion_pressure_score <- clamp(x$queue_occupancy_pct * .4 + pmax(0, f$rtt_slope_5m) * 5 +
    x$packet_loss_pct * 10 + x$interface_discards_sec * .8, 0, 150)
  f
}
latest_features <- function(history) {
  # A horizon in minutes is meaningful only at the model's training cadence.
  if (nrow(history) < 30) stop("At least 30 one-minute samples are required")
  if (any(diff(as.numeric(history$timestamp)) != 60)) stop("Prediction requires consecutive one-minute samples")
  tail(extract_features(history), 1)
}
future_targets <- function(trace, horizon) {
  n <- nrow(trace)
  idx <- seq_len(n) + horizon
  idx[idx > n] <- NA_integer_
  severe <- with(trace, queue_occupancy_pct > 80 | packet_loss_pct > 1.5 | rtt_ms > 65)
  data.frame(failure = as.integer(severe[idx]), rtt = trace$rtt_ms[idx], loss = trace$packet_loss_pct[idx])
}
temporal_split <- function(n) {
  a <- floor(.65 * n); b <- floor(.80 * n)
  if (a <= 60 || b - a <= 60 || n - b <= 60) stop("Trace too short for purged temporal splits")
  # Purge 30 target minutes before every boundary and drop unobserved tail labels.
  list(train = seq_len(a - 30L), calibration = seq.int(a + 1L, b - 30L), test = seq.int(b + 1L, n - 30L))
}
