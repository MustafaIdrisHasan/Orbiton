const { env } = require("../../config/env");
const client = require("./client");
const {
  stableStudentUuid,
  buildFastApiFeatures,
  normalizeFastApiPrediction
} = require("./prediction-mapper");

const TIMEOUT_MS = 2000;
const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 30 * 1000;

const circuit = {
  state: "closed",
  consecutiveFailures: 0,
  openedAt: 0
};

function isCircuitOpen() {
  if (circuit.state !== "open") {
    return false;
  }
  if (Date.now() - circuit.openedAt > OPEN_DURATION_MS) {
    circuit.state = "half-open";
    return false;
  }
  return true;
}

function recordSuccess() {
  circuit.consecutiveFailures = 0;
  circuit.state = "closed";
  circuit.openedAt = 0;
}

function recordFailure() {
  circuit.consecutiveFailures += 1;
  if (circuit.consecutiveFailures >= FAILURE_THRESHOLD) {
    circuit.state = "open";
    circuit.openedAt = Date.now();
  }
}

function hasPredictionServiceUrl() {
  return Boolean(env.predictionServiceUrl && String(env.predictionServiceUrl).trim());
}

/**
 * FastAPI `prediction_service` (RandomForest + SHAP). Used when
 * `PREDICTION_SERVICE_URL` is set; does not use the legacy circuit breaker.
 */
async function predictPlacementFastApi(payload) {
  const student_id = stableStudentUuid(String(payload.studentId || "unknown"));
  const features = buildFastApiFeatures(payload);
  const data = await client.predictPlacement({ studentId: student_id, features });
  return normalizeFastApiPrediction(data);
}

/**
 * Legacy Flask `apps/ml-service` logistic baseline at `ML_SERVICE_URL`.
 */
async function predictPlacementLegacy(payload) {
  if (typeof fetch !== "function") {
    return { available: false, reason: "FETCH_UNAVAILABLE" };
  }
  if (isCircuitOpen()) {
    return { available: false, reason: "CIRCUIT_OPEN" };
  }
  const url = `${env.mlServiceUrl}/v1/predict/placement`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: controller.signal
    });
    if (!response.ok) {
      recordFailure();
      return { available: false, reason: `HTTP_${response.status}` };
    }
    const data = await response.json();
    recordSuccess();
    return { available: true, backend: "ml_service_flask", ...data };
  } catch (error) {
    recordFailure();
    const reason = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    return { available: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Placement prediction: prefers `PREDICTION_SERVICE_URL` (FastAPI) when
 * configured, then falls back to `ML_SERVICE_URL` (Flask) on error or 5xx.
 */
async function predictPlacement(payload) {
  if (hasPredictionServiceUrl()) {
    try {
      return await predictPlacementFastApi(payload);
    } catch (_err) {
      /* fall through to legacy */
    }
  }
  return predictPlacementLegacy(payload);
}

function getIntelligenceStatus() {
  return {
    service: "orbiton-ml-service",
    status: "planned",
    predictionServiceUrl: hasPredictionServiceUrl(),
    matchingServiceUrl: Boolean(env.matchingServiceUrl && String(env.matchingServiceUrl).trim()),
    resumeServiceUrl: Boolean(env.resumeServiceUrl && String(env.resumeServiceUrl).trim()),
    pgvectorMatching: env.features.usePgvectorMatching,
    legacyMlServiceUrl: env.mlServiceUrl
  };
}

function _resetCircuitForTests() {
  circuit.state = "closed";
  circuit.consecutiveFailures = 0;
  circuit.openedAt = 0;
}

function _circuitStateForTests() {
  return { ...circuit };
}

module.exports = {
  getIntelligenceStatus,
  predictPlacement,
  predictPlacementLegacy,
  predictPlacementFastApi,
  _resetCircuitForTests,
  _circuitStateForTests
};
