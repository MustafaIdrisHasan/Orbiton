"""Train a logistic regression placement predictor and dump it as model.joblib.

This script is optional. The Flask app and inference.py work without
running this; defaults baked into inference.DEFAULT_COEFS provide a
sensible baseline. Run this only when you have a labeled dataset and
want to overwrite the baseline weights.

Usage (from apps/ml-service):
    python training/synthetic.py     # generate data/synthetic_placements.csv
    python training/train.py         # fit + dump model.joblib
"""

from __future__ import annotations

import csv
import os
import sys
from typing import List


HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "data", "synthetic_placements.csv")
MODEL_PATH = os.path.join(os.path.dirname(HERE), "model.joblib")

FEATURE_ORDER = ["resume_score", "cgpa", "internship", "projects", "backlogs"]


def _load_csv(path: str):
    X: List[List[float]] = []
    y: List[int] = []
    with open(path, "r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            X.append(
                [
                    float(row["resume_score"]) / 100.0,
                    max(0.0, min(1.0, (float(row["cgpa"]) - 5.0) / 5.0)),
                    float(row["internship"]),
                    min(1.0, float(row["projects"]) / 4.0),
                    min(1.0, float(row["backlogs"]) / 3.0),
                ]
            )
            y.append(int(row["placed"]))
    return X, y


def main() -> int:
    try:
        import joblib  # type: ignore
        from sklearn.linear_model import LogisticRegression  # type: ignore
    except Exception as exc:  # pragma: no cover - optional path
        print(
            f"scikit-learn or joblib not available ({exc}); skipping training. "
            "Inference will use the baseline weights from inference.DEFAULT_COEFS.",
            file=sys.stderr,
        )
        return 0

    if not os.path.exists(DATA_PATH):
        print(
            f"Training data missing at {DATA_PATH}. Run training/synthetic.py first.",
            file=sys.stderr,
        )
        return 1

    X, y = _load_csv(DATA_PATH)
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    weights = dict(zip(FEATURE_ORDER, model.coef_[0].tolist()))
    bundle = {
        "intercept": float(model.intercept_[0]),
        "weights": weights,
        "model_version": "pp-v0.2.0-trained",
        "trained_at": "training/train.py",
        "feature_order": FEATURE_ORDER,
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"Wrote {MODEL_PATH} with weights {weights}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
