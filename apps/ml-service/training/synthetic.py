"""Generate synthetic placement training data.

The dataset mimics the documented feature schema:
    resume_score, cgpa, internship, projects, backlogs -> placed (0/1)

Run this from the ml-service directory:
    python training/synthetic.py
"""

from __future__ import annotations

import csv
import math
import os
import random
from typing import List, Tuple


FEATURES = ["resume_score", "cgpa", "internship", "projects", "backlogs"]


def _sample(seed: int, n: int = 500) -> List[Tuple[float, float, int, int, int, int]]:
    rng = random.Random(seed)
    rows = []
    for _ in range(n):
        cgpa = round(rng.uniform(5.5, 9.8), 2)
        resume_score = round(rng.uniform(20, 95), 1)
        internship = 1 if rng.random() < 0.55 else 0
        projects = rng.randint(0, 6)
        backlogs = 0 if rng.random() < 0.7 else rng.randint(1, 3)

        # True generative process (logistic).
        z = (
            -1.5
            + 2.0 * (resume_score / 100.0)
            + 2.5 * max(0.0, (cgpa - 5.0) / 5.0)
            + 0.8 * internship
            + 1.2 * min(1.0, projects / 4.0)
            - 1.5 * min(1.0, backlogs / 3.0)
            + rng.gauss(0, 0.5)
        )
        prob = 1.0 / (1.0 + math.exp(-z))
        placed = 1 if rng.random() < prob else 0
        rows.append((resume_score, cgpa, internship, projects, backlogs, placed))
    return rows


def write_csv(path: str, rows: List[Tuple[float, float, int, int, int, int]]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(FEATURES + ["placed"])
        for row in rows:
            writer.writerow(row)


if __name__ == "__main__":
    out_path = os.path.join(os.path.dirname(__file__), "data", "synthetic_placements.csv")
    rows = _sample(seed=42, n=500)
    write_csv(out_path, rows)
    print(f"Wrote {len(rows)} rows to {out_path}")
