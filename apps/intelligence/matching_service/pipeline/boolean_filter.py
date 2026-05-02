"""Boolean (strict) filter — checks mandatory criteria before scoring.

We DO NOT drop rows that fail; we attach `boolean_pass=False` and let the
caller decide. This is part of the explainability contract: "near miss"
visibility helps both students (close-but-not-eligible feedback) and TPOs
(see who would qualify with one more skill).
"""
from __future__ import annotations

from shared.schemas import BooleanGate, DriveVector, StudentVector


def evaluate(student: StudentVector, drive: DriveVector) -> BooleanGate:
    failed: list[str] = []
    student_skills = {s.lower().strip() for s in student.skills_normalized}
    required = {s.lower().strip() for s in drive.required_skills}
    missing = sorted(required - student_skills)
    if missing:
        failed.append(f"missing_required_skills:{','.join(missing)}")

    if drive.min_cgpa is not None and student.cgpa is not None:
        if student.cgpa < drive.min_cgpa:
            failed.append(f"cgpa_below_min:{student.cgpa}<{drive.min_cgpa}")

    if drive.min_experience_years is not None and student.experience_years is not None:
        if student.experience_years < drive.min_experience_years:
            failed.append(
                f"experience_below_min:{student.experience_years}<{drive.min_experience_years}"
            )

    return BooleanGate(
        passes=not failed,
        failed_reasons=failed,
        missing_required_skills=missing,
    )
