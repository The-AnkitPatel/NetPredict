source("R/bootstrap.R")
source("R/api.R")
api <- build_api()
api$run(host = Sys.getenv("HOST", "127.0.0.1"), port = as.integer(Sys.getenv("PORT", "8000")))
