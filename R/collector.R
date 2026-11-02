read_interface_counters <- function() {
  if (.Platform$OS.type == "windows") {
    command <- "Get-NetAdapterStatistics | Select-Object Name,ReceivedBytes,SentBytes | ConvertTo-Json -Compress"
    output <- system2("powershell.exe", c("-NoProfile", "-NonInteractive", "-Command", shQuote(command)), stdout = TRUE)
    if (!is.null(attr(output, "status")) || !length(output) || !nzchar(paste(output, collapse = ""))) stop("Windows interface counters unavailable: check permissions for Get-NetAdapterStatistics")
    x <- jsonlite::fromJSON(paste(output, collapse = ""))
    if (is.list(x) && !is.data.frame(x)) x <- as.data.frame(x)
    return(data.frame(interface_id = x$Name, bytes = x$ReceivedBytes + x$SentBytes))
  }
  if (file.exists("/proc/net/dev")) {
    lines <- readLines("/proc/net/dev")[-(1:2)]
    return(do.call(rbind, lapply(lines, function(line) {
      parts <- strsplit(trimws(line), ":", fixed = TRUE)[[1]]
      values <- scan(text = parts[2], quiet = TRUE)
      data.frame(interface_id = trimws(parts[1]), bytes = values[1] + values[9])
    })))
  }
  stop("Live counters support Windows and Linux; use telemetry ingestion on other systems")
}
new_collector <- function() {
  e <- new.env(parent = emptyenv()); e$previous <- NULL; e$time <- NULL; e
}
collect_live <- function(collector, capacity_mbps = 1000) {
  if (!is.numeric(capacity_mbps) || length(capacity_mbps) != 1 || !is.finite(capacity_mbps) || capacity_mbps <= 0) stop("Invalid capacity_mbps")
  current <- read_interface_counters(); now <- Sys.time()
  previous <- collector$previous; dt <- as.numeric(difftime(now, collector$time %||% now, units = "secs"))
  collector$previous <- current; collector$time <- now
  idx <- if (is.null(previous)) rep(NA_integer_, nrow(current)) else match(current$interface_id, previous$interface_id)
  delta <- if (is.null(previous)) rep(NA_real_, nrow(current)) else pmax(0, current$bytes - previous$bytes[idx])
  throughput <- if (dt <= 0) rep(NA_real_, nrow(current)) else delta * 8 / dt / 1e6
  list(source = "live_hardware_counters", timestamp = utc_time(now), interfaces = data.frame(
    interface_id = current$interface_id, throughput_mbps = throughput, bandwidth_util_pct = clamp(throughput / capacity_mbps * 100)),
    prediction = NULL, note = "First poll establishes baseline. Queue depth, RTT, loss and CPU are not fabricated; submit full one-minute telemetry to forecast.")
}
