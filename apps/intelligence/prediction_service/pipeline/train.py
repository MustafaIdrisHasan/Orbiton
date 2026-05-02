"""Train a baseline Random Forest classifier and save it as a versioned
joblib artifact. Re-run with real institutional data when available.

CLI:
  python -m prediction_service.pipeline.train --output ./models/current
  python -m prediction_service.pipeline.train --csv data.csv --output ./models/current
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from .. import PREDICTION_VERSION
from .features import DEPARTMENTS, FEATURE_ORDER, NUMERIC_FEATURES


def _synthesize_baseline(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate a synthetic dataset that mimics the public Kaggle placement
    dataset's structure and dynamics. Inspired by charans2702/Placement_Prediction
    and similar campus-placement datasets.

    The label `placed` is generated from a hand-crafted logistic with realistic
    weights so the model learns sensible signals (CGPA, internships, skill_count
    are strongly positive; backlogs negative)."""
    rng = np.random.default_rng(seed)
    df = pd.DataFrame(
        {
            "cgpa": np.clip(rng.normal(7.5, 1.0, n), 4.0, 10.0),
            "backlog_count": rng.poisson(0.3, n),
            "internship_count": rng.poisson(1.0, n),
            "hackathon_count": rng.poisson(1.2, n),
            "skill_count": rng.poisson(8.0, n),
            "project_count": rng.poisson(3.0, n),
            "certification_count": rng.poisson(2.0, n),
            "year": rng.choice([3, 4], n),
            "has_internship": rng.binomial(1, 0.55, n),
            "communication_score": np.clip(rng.normal(6.5, 1.5, n), 0, 10),
            "aptitude_score": np.clip(rng.normal(65, 12, n), 0, 100),
            "department": rng.choice(DEPARTMENTS, n, p=_dept_dist()),
        }
    )

    # Logit weights chosen to be reasonable, not perfect.
    z = (
        0.55 * (df["cgpa"] - 6.5)
        + 0.40 * df["internship_count"]
        + 0.20 * df["hackathon_count"]
        + 0.05 * df["skill_count"]
        + 0.10 * df["project_count"]
        + 0.06 * df["certification_count"]
        + 0.10 * (df["communication_score"] - 5)
        + 0.02 * (df["aptitude_score"] - 50)
        - 0.80 * df["backlog_count"]
        + 0.30 * df["has_internship"]
    )
    p = 1 / (1 + np.exp(-z))
    df["placed"] = (rng.uniform(size=n) < p).astype(int)
    return df


def _dept_dist() -> list[float]:
    raw = [0.30, 0.18, 0.14, 0.06, 0.10, 0.06, 0.04, 0.04, 0.04, 0.04]
    s = sum(raw)
    return [r / s for r in raw]


def _to_matrix(df: pd.DataFrame) -> np.ndarray:
    """Encode the same way features_to_vector does, but on a DataFrame."""
    one_hot = pd.get_dummies(df["department"]).reindex(columns=DEPARTMENTS, fill_value=0)
    one_hot.columns = [f"dept_{c}" for c in one_hot.columns]
    numeric = df[NUMERIC_FEATURES].astype(float)
    matrix = pd.concat([numeric, one_hot.astype(float)], axis=1)
    matrix = matrix[FEATURE_ORDER]  # enforce order
    return matrix.to_numpy()


def train(csv: Path | None, output: Path) -> None:
    if csv is not None and csv.exists():
        df = pd.read_csv(csv)
    else:
        print("[train] No CSV provided — using synthetic baseline dataset")
        df = _synthesize_baseline()

    if "placed" not in df.columns:
        raise SystemExit("CSV must contain a `placed` column (0/1)")

    df["has_internship"] = df["has_internship"].astype(int) if "has_internship" in df.columns else (
        df["internship_count"] > 0
    ).astype(int)

    X = _to_matrix(df)
    y = df["placed"].astype(int).to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=5,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )
    clf.fit(X_train, y_train)

    proba = clf.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_test, pred)),
        "f1": float(f1_score(y_test, pred)),
        "roc_auc": float(roc_auc_score(y_test, proba)),
        "report": classification_report(y_test, pred, output_dict=True),
        "feature_order": FEATURE_ORDER,
        "model_version": PREDICTION_VERSION,
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
    }

    output.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, output / "rf.joblib")
    (output / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (output / "feature_order.json").write_text(json.dumps(FEATURE_ORDER, indent=2))

    print(f"[train] saved model to {output}")
    print(f"[train] metrics: accuracy={metrics['accuracy']:.3f}  "
          f"f1={metrics['f1']:.3f}  auc={metrics['roc_auc']:.3f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=None,
                        help="Optional CSV with feature columns + `placed` label")
    parser.add_argument("--output", type=Path, required=True,
                        help="Output directory for the joblib + metrics")
    args = parser.parse_args()
    train(args.csv, args.output)


if __name__ == "__main__":
    main()
