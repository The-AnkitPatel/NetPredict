# Dashboard

The React interface displays telemetry and forecasts from the R API.

Start the backend from the repository root with `Rscript scripts/run_api.R`, then:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to port 8000. All forecasts and simulations are computed by the R backend.

Use `npm run build` for a production bundle. The Docker image serves the bundle through nginx and proxies `/api` to the backend service.
