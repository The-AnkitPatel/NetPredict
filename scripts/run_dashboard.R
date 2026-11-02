source("R/bootstrap.R")
shiny::runApp(".", host = Sys.getenv("HOST", "127.0.0.1"), port = as.integer(Sys.getenv("PORT", "3838")), launch.browser = interactive())
