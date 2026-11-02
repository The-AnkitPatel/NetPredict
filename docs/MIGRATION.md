# Migration from the Python branch

The entire executable application is authored in R. CSV data and infrastructure
configuration retain their natural formats. Shiny dependencies deliver browser
JavaScript internally; there is no maintained TypeScript application or Python bridge.

| Original | R branch |
|---|---|
| FastAPI / Pydantic | Plumber routes and explicit telemetry/scenario validation |
| pandas / NumPy | R data frames, vector arithmetic, rolling functions and EWMA |
| LightGBM classifiers | `ranger` probability forests, one per horizon |
| One T+15 regression reused for all horizons | Separate RTT/loss forests for each horizon |
| sklearn isotonic calibration | Weighted pool-adjacent-violators with tied-score handling |
| Isolation Forest | `isotree` isolation forest, fitted only on training rows |
| Python SHAP TreeExplainer | Monte Carlo permutation Shapley on raw probability |
| joblib artifacts | RDS forests, calibrators, conformal quantiles and background data |
| React / browser fallback | Shiny application with isolated session state |
| Next.js / Obsidian handbook | Markdown handbook and R Markdown notebook |
| pytest | testthat plus a real HTTP smoke script |
| Python live collector / experimental eBPF | Read-only R Windows/Linux byte-counter collector |

## Deliberate correctness changes

- Keep the original datasets, but reconstruct targets from telemetry. Unobserved
  future labels are `NA`, never wrapped or assigned a false normal label.
- Split chronologically at 65% and 80%, purge 30 rows before each boundary, and
  exclude the final 30 rows from evaluation. Labels never cross fold boundaries.
- Train RTT/loss regressors and conformal residual quantiles per horizon.
- Persist all calibration state; rebuild the native anomaly model deterministically
  from the stored training reference on load.
- Require 30 consecutive one-minute samples before forecasting. Ingestion can
  store other cadences, but the prediction path rejects them explicitly.
- Reject duplicate/out-of-order timestamps and invalid batches atomically.
- Read-only predictions do not ingest the same record again. Unknown interfaces
  return an error instead of silently returning another device's forecast.
- Reset and jump rebuild history so unrelated times do not share a rolling window.
- A zero-action simulation is the baseline. Other scenarios transform a full
  history before recomputing derived features, and do not mutate telemetry.
- Incident outcomes remain pending until the exact T+15 observation is available;
  a missing timestamp is reported as missing. Prevention is unknown, never invented.

## Compatibility and limitations

The `/api/v1` endpoint families remain. Payloads use the original forecast field
names where applicable, but this is a new R application, not binary model parity.
Calibration metrics identify random forests, not LightGBM. Explanation responses
include the approximation method and probability-scale baseline.

Live polling returns measured interface bytes/throughput only; queue depth, loss,
CPU, RTT and BGP data cannot be recovered from byte counters. It does not return
a fabricated full record or forecast. Supply complete one-minute records through
ingestion for predictions. The experimental kernel eBPF program is not retained:
kernel probes are not implementable in pure R and were not part of the portable lab.

The dashboard talks directly to R services and does not share state with the
separate API process. API defaults bind to loopback. Docker explicitly binds to all
interfaces for port mapping. CORS is unnecessary for the Shiny dashboard.

Recalibration reuses the original calibration fold. It does not claim to learn from
unlabelled live observations. Model health reports held-out trace evaluation, not
continuous live monitoring. Real data and causal intervention validation are future
work. This branch does not claim performance equality with Python models or exact
TreeSHAP values.
