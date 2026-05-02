"""Generate a short, deterministic rationale string for each match.

This is intentionally rule-based, not LLM-based: TPOs and students need
predictable, auditable explanations. The score breakdown (numeric) is
already in MatchExplanation; this string is a human gloss on top.
"""
from __future__ import annotations

from shared.schemas import BooleanGate


def build_rationale(
    *,
    cos: float,
    sk_jaccard: float,
    exp_fit: float,
    cgpa_fit: float,
    gate: BooleanGate,
    matched: list[str],
) -> str:
    parts: list[str] = []

    if cos >= 0.75:
        parts.append("Strong semantic match between profile and JD.")
    elif cos >= 0.5:
        parts.append("Moderate semantic alignment with JD.")
    else:
        parts.append("Limited semantic overlap with JD.")

    if matched:
        head = ", ".join(matched[:5])
        more = "" if len(matched) <= 5 else f" (+{len(matched) - 5} more)"
        parts.append(f"Skill overlap: {head}{more}.")
    else:
        parts.append("No overlapping skills found in taxonomy.")

    if not gate.passes:
        if gate.missing_required_skills:
            parts.append(
                "Missing mandatory: " + ", ".join(gate.missing_required_skills) + "."
            )
        non_skill = [r for r in gate.failed_reasons if not r.startswith("missing_required_skills")]
        if non_skill:
            parts.append("Eligibility gap: " + "; ".join(non_skill) + ".")

    if cgpa_fit >= 1.0 and gate.passes:
        parts.append("Meets/exceeds CGPA threshold.")
    if exp_fit >= 1.0 and gate.passes:
        parts.append("Meets/exceeds experience requirement.")

    return " ".join(parts)
