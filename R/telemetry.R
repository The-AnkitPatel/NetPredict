`%||%` <- function(x, y) if (is.null(x)) y else x
clamp <- function(x, low = 0, high = 100) pmin(high, pmax(low, x))
horizons <- c(5L, 15L, 30L)
raw_fields <- c("bandwidth_util_pct", "throughput_mbps", "rtt_ms", "rtt_jitter_ms",
  "queue_occupancy_pct", "packet_loss_pct", "tcp_retrans_rate", "interface_discards_sec",
  "crc_errors_sec", "cpu_util_pct", "memory_util_pct", "bgp_flap_count")
record_fields <- c("timestamp", "device_id", "interface_id", raw_fields)
utc_time <- function(x = Sys.time()) format(x, "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
parse_time <- function(x) {
  if (inherits(x, "POSIXt")) return(as.POSIXct(x, tz = "UTC"))
  as.POSIXct(sub("Z$", "", gsub("T", " ", x, fixed = TRUE)), tz = "UTC")
}
validate_records <- function(records) {
  if (is.list(records) && !is.data.frame(records)) {
    records <- do.call(rbind, lapply(records, function(r) as.data.frame(r, stringsAsFactors = FALSE)))
  }
  if (!is.data.frame(records) || !nrow(records)) stop("Empty telemetry batch")
  if (!"timestamp" %in% names(records)) records$timestamp <- utc_time()
  if (!"bgp_flap_count" %in% names(records)) records$bgp_flap_count <- 0L
  missing <- setdiff(record_fields, names(records))
  if (length(missing)) stop("Missing fields: ", paste(missing, collapse = ", "))
  for (field in c("device_id", "interface_id")) {
    if (!is.character(records[[field]]) || anyNA(records[[field]]) || any(!nzchar(records[[field]]))) stop("Invalid ", field)
  }
  for (field in raw_fields) {
    value <- records[[field]]
    if (!is.numeric(value) || any(!is.finite(value)) || any(value < 0)) stop("Invalid ", field)
    if (grepl("_pct$", field) && any(value > 100)) stop(field, " must be <= 100")
  }
  if (any(records$bgp_flap_count != floor(records$bgp_flap_count))) stop("BGP count must be an integer")
  records$timestamp <- parse_time(records$timestamp)
  if (anyNA(records$timestamp)) stop("Invalid timestamp; use UTC ISO 8601")
  records[record_fields]
}
entity_key <- function(device, interface) paste0(nchar(device), ":", device, interface)
new_windows <- function(capacity = 720L) {
  stopifnot(capacity >= 30)
  e <- new.env(parent = emptyenv())
  e$capacity <- capacity
  e$buffers <- list()
  e
}
ingest_records <- function(windows, records) {
  records <- validate_records(records)
  # Validate every entity before committing, so rejected batches are atomic.
  updated <- windows$buffers
  for (i in seq_len(nrow(records))) {
    row <- records[i, , drop = FALSE]
    key <- entity_key(row$device_id, row$interface_id)
    old <- updated[[key]]
    if (!is.null(old) && row$timestamp <= tail(old$timestamp, 1)) stop("Timestamps must increase within each interface")
    updated[[key]] <- tail(rbind(old, row), windows$capacity)
  }
  windows$buffers <- updated
  invisible(nrow(records))
}
window_history <- function(windows, device = "core-router-alpha", interface = "xe-0/0/1", limit = 720L) {
  if (length(limit) != 1 || !is.finite(limit) || limit < 1 || limit > 720 || limit != floor(limit)) stop("limit must be an integer in 1..720")
  x <- windows$buffers[[entity_key(device, interface)]]
  if (is.null(x)) stop("No telemetry for the requested device/interface")
  tail(x, limit)
}
generate_trace <- function(n = 10080L, seed = 42L) {
  stopifnot(n >= 300)
  set.seed(seed)
  t <- seq_len(n) - 1L
  util <- clamp(25 + 22.5 * (1 - cos(2 * pi * (t / 60 - 4) / 24)) + rnorm(n, 0, 3.5), 10, 95)
  queue <- pmax(0, (util - 40) * 1.2) + rexp(n, 1 / 1.5)
  bgp <- crc <- rep(0, n)
  for (start in seq(480, n, by = 1100)) {
    idx <- seq.int(start, min(n, start + 50))
    queue[idx] <- queue[idx] + 70
    util[idx] <- clamp(util[idx] + 28)
    bgp[idx] <- sample(c(0, 0, 2, 4), length(idx), replace = TRUE)
  }
  queue <- clamp(queue, 2, 99.8)
  loss <- clamp((pmax(0, queue - 85) / 15)^1.8 * 8.5, 0, 25)
  data.frame(timestamp = as.POSIXct("2026-09-01", tz = "UTC") + t * 60,
    device_id = "core-router-alpha", interface_id = "xe-0/0/1",
    bandwidth_util_pct = util, throughput_mbps = util * 100,
    rtt_ms = pmax(11, 14 + (queue / 100)^2 * 120 + rnorm(n, 0, 1.2)),
    rtt_jitter_ms = abs(rnorm(n, 1.8, 1.2)), queue_occupancy_pct = queue,
    packet_loss_pct = loss, tcp_retrans_rate = loss * 12 + rexp(n, 20),
    interface_discards_sec = pmax(0, queue - 85) * 18, crc_errors_sec = crc,
    cpu_util_pct = clamp(20 + util * .55 + bgp * 6.5 + rnorm(n, 0, 2)),
    memory_util_pct = clamp(35 + queue * .35 + rnorm(n, 0, 1.5)), bgp_flap_count = bgp)
}
load_trace <- function(path = "data/telemetry_trace.csv") {
  x <- if (file.exists(path)) read.csv(path, stringsAsFactors = FALSE) else generate_trace()
  x <- validate_records(x)
  if (length(unique(entity_key(x$device_id, x$interface_id))) != 1) stop("Training trace must contain one interface")
  if (any(diff(as.numeric(x$timestamp)) != 60)) stop("Training data requires consecutive one-minute samples")
  x
}
