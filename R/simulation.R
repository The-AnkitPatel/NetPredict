scenario_defaults <- list(horizon_minutes = 15L, reroute_traffic_pct = 0,
  ingress_rate_limit_pct = 0, buffer_expansion_factor = 1, enable_priority_queuing = FALSE)
validate_scenario <- function(request) {
  if (!is.list(request)) stop("Scenario must be a JSON object")
  request <- modifyList(scenario_defaults, request)
  bounds <- list(horizon_minutes = c(5, 30), reroute_traffic_pct = c(0, 100), ingress_rate_limit_pct = c(0, 90), buffer_expansion_factor = c(1, 3))
  for (field in names(bounds)) {
    value <- request[[field]]
    if (!is.numeric(value) || length(value) != 1 || !is.finite(value) || value < bounds[[field]][1] || value > bounds[[field]][2]) stop("Invalid ", field)
  }
  if (!request$horizon_minutes %in% horizons) stop("Unsupported horizon")
  if (!is.logical(request$enable_priority_queuing) || length(request$enable_priority_queuing) != 1 || is.na(request$enable_priority_queuing)) stop("Priority queuing must be boolean")
  request
}
simulate_scenario <- function(service, request) {
  request <- validate_scenario(request)
  device <- request$device_id %||% "core-router-alpha"; interface <- request$interface_id %||% "xe-0/0/1"
  history <- window_history(service$windows, device, interface)
  base_features <- latest_features(history)
  baseline <- predict_horizon(service$system, base_features, request$horizon_minutes)
  reduction <- (1 - request$reroute_traffic_pct / 100) * (1 - request$ingress_rate_limit_pct / 100)
  cf <- history
  # Steady-state surrogate: transform a whole history so derived features stay consistent.
  cf$bandwidth_util_pct <- cf$bandwidth_util_pct * reduction
  cf$throughput_mbps <- cf$throughput_mbps * reduction
  cf$queue_occupancy_pct <- cf$queue_occupancy_pct * reduction^1.5 / request$buffer_expansion_factor
  # More buffer alone does not reduce absolute queueing delay.
  cf$rtt_ms <- pmax(0, 14 + (history$rtt_ms - 14) * reduction^1.5)
  cf$packet_loss_pct <- cf$packet_loss_pct * reduction^2 / request$buffer_expansion_factor
  cf$tcp_retrans_rate <- cf$tcp_retrans_rate * reduction^2
  cf$interface_discards_sec <- cf$interface_discards_sec * reduction^2
  if (request$enable_priority_queuing) {
    cf$packet_loss_pct <- cf$packet_loss_pct * .3
    cf$tcp_retrans_rate <- cf$tcp_retrans_rate * .4
  }
  counterfactual <- predict_horizon(service$system, latest_features(cf), request$horizon_minutes)
  delta <- (counterfactual$calibrated_probability - baseline$calibrated_probability) / max(.01, baseline$calibrated_probability) * 100
  verdict <- if (baseline$calibrated_probability < .35) "STABLE" else if (delta <= -50) "OPTIMAL" else if (delta <= -20) "EFFECTIVE" else if (delta < 0) "MARGINAL" else "INEFFECTIVE"
  list(scenario_id = paste0("SIM-", service$sequence), device_id = device, interface_id = interface, horizon_minutes = request$horizon_minutes,
    baseline_risk = baseline$calibrated_probability, counterfactual_risk = counterfactual$calibrated_probability,
    risk_delta_pct = delta, baseline_rtt_ms = baseline$predicted_rtt_ms, counterfactual_rtt_ms = counterfactual$predicted_rtt_ms,
    baseline_queue_pct = tail(history$queue_occupancy_pct, 1), counterfactual_queue_pct = tail(cf$queue_occupancy_pct, 1),
    verdict = verdict, operator_guidance = "Compare estimated benefit with operational cost before acting.",
    counterfactual_explanation = "Steady-state feature intervention, not a causal guarantee or a network configuration change.")
}
prescribe_scenario <- function(service, device = "core-router-alpha", interface = "xe-0/0/1", horizon = 15L) {
  grid <- expand.grid(reroute_traffic_pct = c(0, 15, 25, 35, 50), ingress_rate_limit_pct = c(0, 5, 10, 15),
    buffer_expansion_factor = c(1, 1.25, 1.5), enable_priority_queuing = c(FALSE, TRUE))
  requests <- lapply(seq_len(nrow(grid)), function(i) c(as.list(grid[i, ]), list(device_id = device, interface_id = interface, horizon_minutes = horizon)))
  sims <- lapply(requests, function(r) simulate_scenario(service, r))
  risk <- vapply(sims, function(s) s$counterfactual_risk, numeric(1))
  cost <- with(grid, reroute_traffic_pct + 3 * ingress_rate_limit_pct + 8 * (buffer_expansion_factor - 1) + 12 * enable_priority_queuing)
  feasible <- which(risk < .25)
  i <- if (length(feasible)) feasible[which.min(cost[feasible])] else order(risk, cost)[1]
  list(status = if (length(feasible)) "OPTIMIZED" else "NO_FEASIBLE_POLICY", recommended_scenario = requests[[i]],
    simulation = sims[[i]], rationale = "Minimum-cost feasible candidate in a bounded grid; no device changes applied.")
}
