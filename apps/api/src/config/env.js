require("dotenv").config();

function flag(name) {
  return String(process.env[name] || "").toLowerCase() === "true";
}

const nodeEnv = process.env.NODE_ENV || "development";

/**
 * Browsers scope localStorage by origin. Two dev UIs (e.g. :5173 and :5174) let TPO
 * and student stay logged in at once; each must be allowed here for credentialed fetches.
 * Set CORS_ORIGIN to a comma-separated list, or leave unset in development for a safe default.
 */
function parseCorsOrigins() {
  const raw = (process.env.CORS_ORIGIN || "").trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (nodeEnv === "production") {
    return ["http://localhost:5173"];
  }
  return [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ];
}

const corsOrigins = parseCorsOrigins();

const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  /** @deprecated use corsOrigins; kept for compatibility: first allowed origin */
  corsOrigin: corsOrigins[0] || "http://localhost:5173",
  corsOrigins,
  jwtSecret: process.env.JWT_SECRET || "local-jwt-secret",
  postgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL || "",
  mongoUrl: process.env.MONGO_URL || "",
  storageBucket: process.env.STORAGE_BUCKET || "orbiton-local",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  /** FastAPI intelligence stack (optional; see apps/intelligence). */
  resumeServiceUrl: process.env.RESUME_SERVICE_URL || "",
  matchingServiceUrl: process.env.MATCHING_SERVICE_URL || "",
  predictionServiceUrl: process.env.PREDICTION_SERVICE_URL || "",
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379/0",
  usePostgres: flag("USE_POSTGRES"),
  features: {
    resumeScoring: flag("ENABLE_RESUME_SCORING"),
    matching: flag("ENABLE_MATCHING"),
    prediction: flag("ENABLE_PREDICTION"),
    /** When true + PG has embeddings, matching uses apps/intelligence matching_service. */
    usePgvectorMatching: flag("USE_PGVECTOR_MATCHING")
  }
};

module.exports = {
  env
};

