# Validation record

Validated locally on Windows with R 4.6.1 on 2 November 2026.

| Check | Result |
|---|---|
| `Rscript scripts/test.R` | Passed: 57 expectations across feature, split, buffer, calibration and system tests |
| Full 120-tree training | Passed for all three classification, RTT and loss horizons |
| Save/load model round trip | Passed, including recalibration state and deterministic anomaly reconstruction |
| `Rscript scripts/smoke_api.R` | Passed against a separate R HTTP server: forecasts, explanations, ingestion, errors, replay, simulation, prescription and recalibration |
| `Rscript scripts/smoke_dashboard.R` | Passed: outputs, replay controls, incident jump, explanation, scenario and reset |
| R Markdown analysis chunks | Extracted with `knitr::purl` and executed successfully |
| Browser inspection | Dashboard telemetry, plots, incident replay and forecast panels inspected with Playwright |
| Docker build/run | Not executed: Docker Desktop Linux engine was unavailable |
| Linux / GitHub Actions | Workflow supplied; local Windows verification does not claim Linux CI success |
| Live hardware | Windows counters verified with two polls; full network forecasting requires external complete telemetry |
| Compose configuration | `docker compose config --quiet` passed |

## Synthetic holdout results (15-minute horizon)

120 trees per forest, seed 42, original bundled trace, purged chronological folds:

| Metric | Measured value |
|---|---:|
| Accuracy | 0.9849 |
| Precision | 0.7059 |
| Recall | 0.7059 |
| F1 | 0.7059 |
| ROC AUC | 0.8191 |
| Brier score | 0.01311 |
| RTT MAE | 5.133 ms |
| RTT interval empirical coverage | 86.71% |

The nominal interval level is 90%; measured time-series coverage is lower. The
persistence baseline has the same precision/recall on this fold, so these results
do not establish superior early warning. See the generated model-health report
for all baseline scores and the notebook for package/session information.

Dependency versions used locally: shiny 1.14.0, plumber 1.3.3, ranger 0.18.0,
isotree 0.6.1-5, jsonlite 2.0.0 and testthat 3.3.2. Package installation resolves
available versions from CRAN; this branch does not include a frozen package lock.
