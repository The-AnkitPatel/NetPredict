# NetPredict

Network congestion forecasting with an R backend and the original React dashboard.

## Run locally

Requirements: R 4.3 or newer and Node.js 22.12 or newer.

From the repository root:

```sh
Rscript scripts/setup.R
Rscript scripts/run_api.R
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The frontend forwards `/api` requests to the R server on port 8000. The first backend launch trains the models and saves them under `models/`.

Open `NetPredict.Rproj` to work on the R code in RStudio. If Windows cannot find `Rscript`, add the R installation's `bin` directory to PATH.

## Features

- Replay one-minute telemetry, jump to congestion events and reset the timeline.
- Forecast failure probability, RTT and packet loss at 5, 15 and 30 minutes.
- Compare present anomalies with future risk.
- Inspect Shapley feature contributions.
- Test rerouting, traffic shaping, buffer capacity and priority queuing.
- View calibration, baseline comparisons, drift and incident outcomes.
- Read Windows or Linux interface throughput using the host-counter control.

## Project structure

| Directory | Contents |
|---|---|
| `frontend/` | React dashboard, styles and API client |
| `R/` | Telemetry processing, models, API, replay and simulation |
| `scripts/` | Setup, API launcher, training and checks |
| `data/` | Bundled telemetry CSV files |
| `tests/testthat/` | R tests |
| `notebooks/` | R Markdown analysis |
| `docs/` | API reference and lab guide |
| `docs-portal/` | Documentation website |

## Tests and training

```sh
Rscript scripts/test.R
Rscript scripts/train.R
Rscript scripts/smoke_api.R
npm --prefix frontend run build
```

Training writes `models/netpredict.rds` and `reports/model-health.json`. Tests cover rolling features, chronological splits, validation, buffer isolation, saved models, explanations, replay and API requests.

The notebook can be opened in RStudio or rendered from the repository root:

```r
rmarkdown::render("notebooks/NetPredict_ML_Pipeline.Rmd", knit_root_dir = getwd())
```

## Docker

```sh
docker compose up --build
```

Dashboard: http://localhost:5173. API: http://localhost:8000. Host counters inside Docker describe the container's interfaces.

## Web hosting

The dashboard and documentation site can be built by their existing Vercel projects. The R API needs a separate R-capable host. Set `VITE_API_BASE_URL` to its `/api/v1` URL for a hosted dashboard, and allow the dashboard origin using the backend's `CORS_ORIGINS` setting. Without a reachable API, the dashboard shows a connection error instead of simulated fallback predictions.

To run the documentation locally: `cd docs-portal`, `npm ci`, then `npm run dev`.

## Models and data

The backend uses `ranger` probability forests, isotonic calibration, `isotree` anomaly detection and approximate permutation Shapley explanations. RTT intervals use held-out residual quantiles. Separate models are fitted for each forecast horizon.

Training, calibration and testing use chronological folds with a 30-minute gap to prevent future labels from crossing boundaries. Predictions require 30 consecutive one-minute samples per interface.

The bundled data is synthetic. Compare the fitted model with the baseline results before drawing conclusions about early warning. What-if scenarios estimate model responses; they do not change network settings or establish causal effects. Host byte counters alone do not provide all the measurements required for forecasting.

Branch: `rproject`. The original version remains on `main`.
