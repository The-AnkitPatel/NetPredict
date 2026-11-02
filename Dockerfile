FROM rocker/r-ver:4.5.2
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4-openssl-dev libssl-dev libsodium-dev libxml2-dev make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY scripts/setup.R scripts/setup.R
RUN Rscript scripts/setup.R
COPY . .
RUN Rscript scripts/train.R
ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000
CMD ["Rscript", "scripts/run_api.R"]
