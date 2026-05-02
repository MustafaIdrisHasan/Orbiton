"""Orbiton placement-readiness prediction service.

Random Forest classifier over a fixed feature schema. The pipeline:
  1. Node sends a StudentFeatures payload.
  2. We load the latest joblib artifact (versioned).
  3. Classifier emits P(placed) and a SHAP-derived feature contribution list.
  4. Result mapped to a low/medium/high risk band.

Per the architecture rule, this service does NOT write to Postgres. The
caller (Node) persists the PredictionResult in `placement_predictions`.
"""

PREDICTION_VERSION = "1.0.0-baseline"
