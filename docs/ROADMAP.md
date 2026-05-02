# Development roadmap — intelligence and platform

Priorities for the **next maintainers**. Items are epics; order can change with product and compliance needs.

---

## Epic A — Resume Analysis (student + TPO)

**Goal:** Production path from upload → stored file → extracted features → weighted score + explainable breakdown.

| Item | Acceptance (indicative) |
|------|---------------------------|
| API contract | OpenAPI defines analyze + get-score; authZ: student owns resume, TPO reads scoped cohort |
| Storage | Resume file in object storage (adapter already planned in architecture doc) |
| Pipeline | Extractor + scorer in `ml-service` or worker; persist in `resume_scores` + optional detail table/JSON |
| Web | Replace [ResumesPage](apps/web/src/features/resumes/ResumesPage.jsx) stub with list, upload, score display, improvement tips |
| Quality | Golden-file tests on sample PDFs; no score without successful parse |

**Depends on:** Env for storage, institutional policy on PII.

---

## Epic B — Job–Profile Matching (cosine / vector)

**Goal:** Same-length vectors for student and drive; cosine similarity; ranked lists for students and TPOs.

| Item | Acceptance (indicative) |
|------|---------------------------|
| Vector schema | Documented dimension order and vocabulary version |
| API | `matching` endpoints with rate limits; no raw text in logs by default |
| Web | Optional “match %” on drive cards or dedicated view; TPO dashboard widget |
| Explainability | Top positive/negative dimensions or skills in API response |

**Depends on:** Epic A feature definitions (shared skill taxonomy) or parallel taxonomy work.

---

## Epic C — Placement outcome prediction (logistic baseline)

**Goal:** Baseline classifier with calibration; human-in-the-loop for any high-stakes use.

| Item | Acceptance (indicative) |
|------|---------------------------|
| Data | Training set spec (aggregated, GDPR/institution compliant) |
| Model | Logistic regression or equivalent with `modelVersion`, evaluation metrics stored |
| API | Prediction endpoint with flags; student view optional and policy-gated |
| Governance | Bias review checklist; rollback if metrics drift |

**Depends on:** Historical outcome data quality and legal sign-off.

---

## Platform epics (parallel)

- **Replace drive create stub** with full [CreateDrivePage](apps/web/src/features/drives/CreateDrivePage.jsx) form bound to API.
- **Wire Postgres** for modules that still use in-memory mock stores in development.
- **CI:** `vite build` + API lint/test on every PR.

---

*See [ML_PRODUCT_SPEC.md](ML_PRODUCT_SPEC.md) for methodology detail and [HANDOVER.md](HANDOVER.md) for current implementation status.*
