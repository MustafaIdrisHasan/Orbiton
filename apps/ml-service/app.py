from flask import Flask, jsonify

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
                "job-matching-planned",
                "placement-prediction-planned",
            ],
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
