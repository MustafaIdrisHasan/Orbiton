const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { env } = require("./config/env");
const { notFoundHandler } = require("./core/middleware/notFoundHandler");
const { errorHandler } = require("./core/middleware/errorHandler");
const { apiRouter } = require("./modules");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "orbiton-api"
  });
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app
};

