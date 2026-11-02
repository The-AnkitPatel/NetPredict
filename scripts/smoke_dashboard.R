source("app.R")
shiny::testServer(server, {
  session$setInputs(horizon = "15", reroute = 0, shape = 0, buffer = 1, priority = FALSE, play = FALSE)
  stopifnot(grepl("45", output$position))
  for (name in c("metrics", "telemetry_plot", "latest", "forecasts", "action", "anomaly", "risk_plot", "simulation", "health", "baselines", "drift", "calibration_plot", "incidents")) {
    value <- output[[name]]
    stopifnot(!is.null(value))
  }
  session$setInputs(step = 1)
  stopifnot(grepl("46", output$position))
  session$setInputs(jump = 1)
  stopifnot(tail(history()$queue_occupancy_pct, 1) > 85)
  session$setInputs(explain = 1)
  stopifnot(!is.null(output$attribution), !is.null(output$attribution_plot))
  session$setInputs(reroute = 30, priority = TRUE)
  stopifnot(scenario()$counterfactual_queue_pct < scenario()$baseline_queue_pct)
  session$setInputs(reset = 1)
  stopifnot(grepl("46", output$position))
})
cat("Shiny output and control smoke checks passed.\n")
