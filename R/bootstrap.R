# Source from the repository root (or open NetPredict.Rproj in RStudio).
if (dir.exists(".R-library")) .libPaths(c(normalizePath(".R-library"), .libPaths()))
for (module in c("telemetry", "features", "models", "service", "simulation", "collector")) {
  source(file.path("R", paste0(module, ".R")), local = FALSE)
}
