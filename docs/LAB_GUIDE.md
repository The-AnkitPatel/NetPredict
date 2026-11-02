# R Programming lab walkthrough

## Aim

Build and evaluate a network congestion forecasting application using R data
frames, functions, environments, statistical models and interactive visualization in the React dashboard.

## Architecture

CSV or ingestion → validated interface buffers → backward-looking features →
per-horizon forests → isotonic probabilities and conformal RTT bounds → React/API.
An independent Isolation Forest answers whether the current telemetry is unusual.

`new_windows()` uses an R environment for mutable state and a list of data frames
for independent interfaces. The API process owns a service environment. Model
objects are read-only shared startup data until a service explicitly recalibrates.

## Procedure

1. Install packages with `scripts/setup.R`; run `scripts/test.R`.
2. Read `R/features.R`. Explain rolling mean versus EWMA, and why lagged slopes
   do not read future rows. Run the notebook's feature and target sections.
3. Inspect chronological splits. Explain why shuffling and unpurged target shifts
   produce optimistic performance estimates.
4. Train models. Compare Brier score and precision/recall against persistence,
   rolling thresholds and logistic regression. Accuracy alone is misleading when
   failures are rare.
5. Start the API and frontend. Inspect baseline traffic, then jump to an incident. Observe that
   present anomalies and future predictions answer different questions.
6. Generate an explanation. Verify that baseline plus signed contributions equals
   raw probability; calibrated probability need not equal this sum.
7. Compare a zero-action scenario with rerouting. Discuss why a changed prediction
   is not proof that the intervention would cause that real-world outcome.
8. Inspect RTT interval coverage. Serial dependence and distribution drift mean
   nominal split-conformal coverage is not automatically a time-series guarantee.
9. Export CSV and record your observations in the notebook. Reset replay and check
   that old incident state is cleared.

## Viva questions

- Why are future labels shifted, while features only look backward?
- Why does calibration need a separate chronological fold?
- What does a Brier score measure?
- How do anomaly detection and forecasting differ?
- Why can raw and calibrated probabilities differ?
- What assumptions underpin counterfactual feature transformations?
- Why can the same synthetic data produce excellent accuracy but limited warning?
- Why must throughput be computed from counter differences and elapsed time?

## Troubleshooting

- Run R commands from the repository root. In RStudio open `NetPredict.Rproj`.
- Use `scripts/setup.R` if a package is missing; the library is project-local.
- Delete only `models/netpredict.rds` to force a retrain, or run `scripts/train.R`.
- Change `PORT` if the default is occupied. Set `HOST` only when remote access is
   needed; this lab server has no multi-user authentication layer.
- Missing/irregular telemetry is rejected for predictions. Aggregate externally
   to consecutive one-minute samples; do not label faster samples as minutes.
- Live byte counters alone cannot support the model's full feature set.
