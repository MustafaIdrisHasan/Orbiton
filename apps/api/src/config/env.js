require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "local-jwt-secret",
  postgresUrl: process.env.POSTGRES_URL || "",
  mongoUrl: process.env.MONGO_URL || "",
  storageBucket: process.env.STORAGE_BUCKET || "orbiton-local"
};

module.exports = {
  env
};

