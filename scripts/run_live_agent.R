source("R/bootstrap.R")
collector <- new_collector()
cat("Read-only interface counters. Ctrl+C to stop. Full telemetry is required for predictions.\n")
repeat {
  print(collect_live(collector))
  Sys.sleep(60)
}
