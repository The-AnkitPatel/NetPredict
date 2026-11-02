source("R/bootstrap.R")
# Start a real HTTP server and test requests against a separate R process.
root <- normalizePath(".")
port <- httpuv::randomPort()
process <- callr::r_bg(function(root, port) {
  setwd(root)
  source("R/bootstrap.R"); source("R/api.R")
  build_api()$run(host = "127.0.0.1", port = port)
}, args = list(root, port), libpath = .libPaths(), stdout = "|", stderr = "|")
tryCatch({
  base <- paste0("http://127.0.0.1:", port)
  request <- function(path, method = "GET", body = NULL) {
    handle <- curl::new_handle(customrequest = method)
    if (!is.null(body)) {
      curl::handle_setheaders(handle, "Content-Type" = "application/json")
      curl::handle_setopt(handle, postfields = jsonlite::toJSON(body, auto_unbox = TRUE, dataframe = "rows", POSIXt = "ISO8601"))
    }
    response <- curl::curl_fetch_memory(paste0(base, path), handle)
    result <- list(status = response$status_code, body = jsonlite::fromJSON(rawToChar(response$content), simplifyVector = FALSE))
    if (result$status >= 400) message(path, ": ", rawToChar(response$content))
    result
  }
  ready <- FALSE
  for (i in 1:120) {
    if (!process$is_alive()) stop(paste(process$read_all_error(), collapse = "\n"))
    ready <- tryCatch(request("/api/v1/health")$status == 200L, error = function(e) FALSE)
    if (ready) break
    Sys.sleep(.5)
  }
  stopifnot(ready)
  stopifnot(request("/")$status == 200L)
  prediction <- request("/api/v1/predict/horizons")
  stopifnot(prediction$status == 200L, length(prediction$body$horizons) == 3L)
  stopifnot(request(paste0("/api/v1/explain/", prediction$body$prediction_id))$status == 200L)
  for (path in c("telemetry/latest", "telemetry/history", "explain/latest", "health/model", "predict/incidents")) stopifnot(request(paste0("/api/v1/", path))$status == 200L)
  stopifnot(request("/api/v1/telemetry/latest?device_id=missing")$status == 404L)
  stopifnot(request("/api/v1/telemetry/history?limit=-1")$status == 422L)
  stopifnot(request("/api/v1/telemetry/ingest", "POST", list(records = list()))$status == 422L)
  rows <- load_trace()[1:35, ]; rows$device_id <- "api-test"
  stopifnot(request("/api/v1/telemetry/ingest", "POST", list(records = rows))$body$ingested_count == 35L)
  stopifnot(request("/api/v1/predict/horizons?device_id=api-test")$status == 200L)
  for (action in c("step", "jump-incident", "reset")) stopifnot(request(paste0("/api/v1/telemetry/stream/", action), "POST")$status == 200L)
  sim <- request("/api/v1/simulate", "POST", list(reroute_traffic_pct = 25))
  stopifnot(sim$status == 200L, is.numeric(sim$body$counterfactual_risk))
  stopifnot(request("/api/v1/simulate", "POST", list(reroute_traffic_pct = 101))$status == 422L)
  stopifnot(request("/api/v1/simulate/prescribe", "POST")$status == 200L)
  stopifnot(request("/api/v1/health/recalibrate", "POST")$status == 200L)
  cat("HTTP smoke checks passed.\n")
}, finally = { process$kill() })
