from flask import Flask, jsonify, request

from extractor import extract, extractor_info
from inference import predict

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "orbiton-ml-service"})


@app.get("/v1/status")
def status():
    return jsonify(
        {
            "service": "orbiton-ml-service",
            "capabilities": [
                "resume-analysis-planned",
                "resume-extract-beta",
                "job-matching-planned",
                "placement-prediction-beta",
            ],
            "extractor": extractor_info(),
        }
    )


@app.post("/v1/predict/placement")
def predict_placement():
    payload = request.get_json(silent=True) or {}
    return jsonify(predict(payload))


@app.post("/v1/internal/extract")
def internal_extract():
    """Offline NLP extraction over raw résumé text.

    Body: ``{"text": "<raw text from pdf-parse>"}``. Always returns a profile
    object (possibly with empty values) so callers don't have to special-case
    the response shape. The Express upload handler falls back to its legacy
    keyword sniffer when this route is unreachable.
    """
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    if not isinstance(text, str):
        return jsonify({"error": "field 'text' must be a string"}), 400
    return jsonify(extract(text))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
