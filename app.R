source("R/bootstrap.R")
library(shiny)
shared_models <- load_system()
shared_trace <- load_trace()
ui <- fluidPage(
  tags$head(tags$link(rel = "icon", href = "data:,"), tags$style(HTML(".shiny-html-output{overflow-x:auto} table{font-size:13px} .tab-content{padding-bottom:24px}"))),
  tags$head(tags$style(HTML("body{background:#f4f5ef;color:#182522;font-family:Arial,sans-serif} .container-fluid{max-width:1440px;margin:auto} .well{background:#e6eadd;border:0;border-radius:14px} .nav-tabs{margin:22px 0} .metric{padding:18px;background:white;border-radius:12px;margin:10px 0} .metric strong{font-size:28px;display:block;color:#245c4d} h1{font-weight:800;margin-top:28px} .btn{border-radius:8px} .note{color:#566660;margin:14px 0} table{background:white}"))),
  titlePanel("NetPredict / R Network Intelligence Lab"),
  p(class = "note", "One-minute telemetry · 5 / 15 / 30 minute forecasts · reproducible synthetic-data experiment"),
  sidebarLayout(
    sidebarPanel(width = 3,
      h4("Replay controls"), actionButton("step", "Next minute", class = "btn-primary"),
      actionButton("jump", "Jump to incident"), actionButton("reset", "Reset"),
      checkboxInput("play", "Auto replay (1 second = 1 minute)", FALSE), textOutput("position"),
      hr(), h4("What-if intervention"), selectInput("horizon", "Forecast horizon", c(5, 15, 30), selected = 15),
      sliderInput("reroute", "Reroute traffic (%)", 0, 100, 0),
      sliderInput("shape", "Ingress rate limit (%)", 0, 90, 0),
      sliderInput("buffer", "Buffer capacity multiplier", 1, 3, 1, step = .25),
      checkboxInput("priority", "Priority queuing", FALSE),
      actionButton("prescribe", "Find mitigation"),
      hr(), downloadButton("download", "Export telemetry CSV"),
      p(class = "note", "Scenarios are model estimates. They do not configure network devices.")),
    mainPanel(width = 9,
      uiOutput("metrics"),
      tabsetPanel(
        tabPanel("Live telemetry", plotOutput("telemetry_plot", height = 390), tableOutput("latest")),
        tabPanel("Predictive horizons", tableOutput("forecasts"), p("RTT intervals target 90% marginal coverage; temporal drift can change actual coverage."), textOutput("action")),
        tabPanel("Anomaly vs prediction", h3("Present abnormality and future risk"), textOutput("anomaly"), plotOutput("risk_plot")),
        tabPanel("Root cause", p("Approximate permutation Shapley values explain raw probability. They do not establish causation."), actionButton("explain", "Explain current prediction"), plotOutput("attribution_plot"), tableOutput("attribution")),
        tabPanel("What-if lab", tableOutput("simulation"), verbatimTextOutput("prescription")),
        tabPanel("Model health", tableOutput("health"), plotOutput("calibration_plot"), tableOutput("baselines"), verbatimTextOutput("drift")),
        tabPanel("Incident log", p("Observed outcomes are filled only when the target timestamp is replayed. Prevention is never inferred."), tableOutput("incidents")),
        tabPanel("Live hardware", p("Reads Windows/Linux interface bytes. Poll twice to measure throughput. Complete telemetry must be supplied separately for forecasting."), actionButton("poll", "Poll host interfaces"), tableOutput("hardware")),
        tabPanel("Lab guide", h3("Experiment workflow"), tags$ol(tags$li("Replay normal traffic, then jump to a congestion event."), tags$li("Compare present anomaly score with all three future risks."), tags$li("Generate an explanation and compare rerouting scenarios."), tags$li("Inspect held-out calibration, baselines and drift."), tags$li("Run notebooks/NetPredict_ML_Pipeline.Rmd for the reproducible analysis.")))
      )
    )
  )
)
server <- function(input, output, session) {
  # Each browser session owns its playhead, buffers, prediction cache and incidents.
  service <- new_service(shared_models, shared_trace)
  collector <- new_collector()
  tick <- reactiveVal(0L)
  advance <- function(action) { step_stream(service, action); tick(isolate(tick()) + 1L) }
  observeEvent(input$step, advance("step"))
  observeEvent(input$jump, advance("jump-incident"))
  observeEvent(input$reset, advance("reset"))
  observe({ invalidateLater(1000, session); if (isTRUE(input$play)) advance("step") })
  history <- reactive({ tick(); window_history(service$windows) })
  prediction <- reactive({ tick(); predict_latest(service) })
  output$position <- renderText({ tick(); paste("Minute", service$cursor, "of", nrow(shared_trace)) })
  output$metrics <- renderUI({
    row <- tail(history(), 1); p <- prediction()$primary_horizon
    fluidRow(lapply(list(c("Bandwidth", sprintf("%.1f%%", row$bandwidth_util_pct)), c("Queue occupancy", sprintf("%.1f%%", row$queue_occupancy_pct)),
      c("RTT", sprintf("%.1f ms", row$rtt_ms)), c("15m failure risk", sprintf("%.1f%%", 100 * p$calibrated_probability))),
      function(x) column(3, div(class = "metric", span(x[1]), strong(x[2])))))
  })
  output$telemetry_plot <- renderPlot({
    x <- tail(history(), 120); par(mfrow = c(2, 2), mar = c(3, 4, 2, 1))
    for (field in c("bandwidth_util_pct", "queue_occupancy_pct", "rtt_ms", "packet_loss_pct")) plot(x$timestamp, x[[field]], type = "l", col = "#245c4d", lwd = 2, xlab = "UTC", ylab = "", main = field)
  })
  output$latest <- renderTable(data.frame(metric = gsub("_", " ", raw_fields), value = unlist(tail(history(), 1)[raw_fields], use.names = FALSE)), digits = 2)
  output$forecasts <- renderTable({
    rows <- c("calibrated_probability", "risk_level", "predicted_rtt_ms", "predicted_packet_loss_pct", "conformal_lower_bound_rtt", "conformal_upper_bound_rtt")
    data.frame(metric = gsub("_", " ", rows), lapply(prediction()$horizons, function(h) vapply(h[rows], function(v) if (is.numeric(v)) format(round(v, 3), trim = TRUE) else v, character(1))), check.names = FALSE)
  })
  output$action <- renderText(prediction()$recommended_action)
  output$anomaly <- renderText({ p <- prediction(); sprintf("Anomaly score now: %.3f. %s. Primary future risk: %.1f%%.", p$current_anomaly_score, p$anomaly_status, p$primary_horizon$calibrated_probability * 100) })
  output$risk_plot <- renderPlot({ p <- prediction(); barplot(vapply(p$horizons, function(h) h$calibrated_probability, numeric(1)), names.arg = c("5 min", "15 min", "30 min"), ylim = c(0, 1), col = "#245c4d", ylab = "Calibrated failure probability") })
  explanation <- eventReactive(input$explain, { tick(); explain_features(service$system, latest_features(history())) })
  output$attribution <- renderTable({ req(explanation()); do.call(rbind, lapply(explanation()$all_attributions, as.data.frame)) }, digits = 4)
  output$attribution_plot <- renderPlot({
    req(explanation()); attrs <- head(explanation()$all_attributions, 10)
    par(mar = c(4, 15, 2, 1)); values <- vapply(attrs, function(a) a$shap_value, numeric(1))
    barplot(rev(values), names.arg = rev(vapply(attrs, function(a) a$feature_name, character(1))), horiz = TRUE, las = 1, col = ifelse(rev(values) > 0, "#b65e3e", "#245c4d"), xlab = "Raw probability contribution")
  })
  scenario <- reactive({ tick(); simulate_scenario(service, list(horizon_minutes = as.integer(input$horizon), reroute_traffic_pct = input$reroute, ingress_rate_limit_pct = input$shape, buffer_expansion_factor = input$buffer, enable_priority_queuing = input$priority)) })
  output$simulation <- renderTable({ s <- scenario(); data.frame(metric = c("Failure probability", "Predicted RTT (ms)", "Queue occupancy (%)"), baseline = c(s$baseline_risk, s$baseline_rtt_ms, s$baseline_queue_pct), intervention = c(s$counterfactual_risk, s$counterfactual_rtt_ms, s$counterfactual_queue_pct)) }, digits = 3)
  prescription <- eventReactive(input$prescribe, prescribe_scenario(service, horizon = as.integer(input$horizon)))
  output$prescription <- renderPrint({ req(prescription()); prescription() })
  output$health <- renderTable(as.data.frame(service$system$health$evaluation_metrics), digits = 4)
  output$baselines <- renderTable({ b <- service$system$health$baseline_comparison; do.call(rbind, lapply(names(b), function(name) data.frame(model = name, as.data.frame(b[[name]][c("accuracy", "precision", "recall", "f1", "roc_auc", "brier_score")])))) }, digits = 4)
  output$drift <- renderPrint(service$system$health$drift_monitoring)
  output$calibration_plot <- renderPlot({
    curve <- service$system$health$calibration_curve
    plot(vapply(curve, function(c) c$mean_predicted_probability, numeric(1)), vapply(curve, function(c) c$fraction_positive, numeric(1)), xlim = c(0, 1), ylim = c(0, 1), xlab = "Mean predicted probability", ylab = "Observed failure fraction", pch = 19, col = "#245c4d"); abline(0, 1, lty = 2)
  })
  output$incidents <- renderTable({ tick(); if (!length(service$incidents)) return(data.frame(status = "No critical predictions logged")); do.call(rbind, lapply(service$incidents, as.data.frame)) })
  hardware <- eventReactive(input$poll, tryCatch(collect_live(collector)$interfaces, error = function(e) data.frame(error = conditionMessage(e))))
  output$hardware <- renderTable(hardware())
  output$download <- downloadHandler(filename = function() "netpredict-telemetry.csv", content = function(file) write.csv(history(), file, row.names = FALSE))
}
shinyApp(ui, server)
