# ML / intelligence product specification (target state)

This document captures the **intended** behaviour of three user-facing modules for **Students** and **TPOs**. It is **not** a guarantee of current implementation — the web app and API may still use placeholders; see [HANDOVER.md](HANDOVER.md) for what is wired today.

---

## 1. Resume-Analysis Module

**Goal:** Score and explain a student résumé using a **weighted feature-based** model so students can improve content and TPOs can triage cohorts.

### Feature categories and extracted attributes

| Feature category | Extracted attributes |
|------------------|----------------------|
| **Skills** | Count, diversity, keyword match (against role or drive skill taxonomy) |
| **Education** | CGPA consistency, degree relevance (to target role or branch) |
| **Projects** | Number, domain relevance |
| **Experience** | Internship presence, duration |
| **Completeness** | Section coverage, formatting quality (heuristics or light ML) |

### Aggregation

- Each category produces a **partial score** (or vector of sub-scores).
- A **weighted sum** (weights configurable per institution) yields a **final resume score** and a **breakdown** for UI (radar chart, bullet feedback).
- **Persistence:** Align with Postgres `resume_scores` (extend with versioned JSON breakdown if needed) — see `infrastructure/db/postgres/001_initial_schema.sql`.

### API sketch (future)

- `POST /api/v1/resumes/:id/analyze` — trigger or refresh analysis (async job acceptable).
- `GET /api/v1/resumes/:id/score` — latest score + explanation payload for student and authorized TPO views.

---

## 2. Job–Profile Matching Module (vector space + cosine similarity)

**Goal:** Match a **student profile** to **placement drives / job profiles** with a transparent similarity score for discovery, shortlists, and TPO reporting.

### Feature types and encoding (design)

| Feature type | Encoding method |
|--------------|-----------------|
| **Skills** | Binary (1 = present, 0 = absent) per vocabulary dimension |
| **Keywords** | Term frequency (TF) or TF–IDF over a controlled lexicon |
| **Education** | Categorical mapping (e.g. one-hot or learned embedding bucket) |
| **Experience** | Weighted numeric (duration, internship flag) |

### Similarity

- Build a **fixed-length feature vector** per student and per job/drive (same schema).
- **Cosine similarity** between student vector \(s\) and job vector \(j\):  
  \(\text{sim}(s,j) = \frac{s \cdot j}{\|s\|\|j\|}\) (handle zero-norm defensively).
- **Output:** Ranked list with similarity score + optional “top contributing dimensions” for explainability.

### Consumers

- **Students:** “Best fit” drives on top of discovery.
- **TPOs:** Cohort vs drive fit, export, and compliance review (no black-box ranking without audit fields).

### API sketch (future)

- `GET /api/v1/matching/drives?studentId=` or derived from session — ranked drives with `similarity`.
- `GET /api/v1/matching/students?driveId=` — TPO view (authorized, rate-limited).

---

## 3. Placement Outcome Prediction Module (logistic regression family)

**Goal:** Estimate **probability or risk band** of placement outcomes (e.g. offer within window, progression to final round) using **interpretable** models first — **logistic regression** as the baseline; other classifiers only with governance.

### Inputs (illustrative)

- Normalized resume features (from module 1).
- Academic signals (CGPA, backlogs, department).
- Historical placement stats for the institution (aggregated, privacy-preserving).
- Drive difficulty or selectivity proxies if available.

### Outputs

- Probability or discrete **risk band** (low / medium / high).
- **Calibration** and **bias** review before production use; TPO-only or restricted student messaging.

### Deployment

- Training and batch retrain in **ml-service** or offline; **inference** via HTTP from API with caching and audit logging.
- No individual automated “reject” decisions without human review — product policy decision.

### API sketch (future)

- `POST /api/v1/predictions/placement` — body with `studentId` + optional `driveId`, returns prediction + version of model.

---

## Cross-cutting requirements

- **OpenAPI** entries for every new route; version model outputs (`modelVersion`, `computedAt`).
- **Feature flags** for beta models.
- **Privacy:** consent for model training on résumé text; retention limits in Mongo for derived artifacts (per architecture overview).

---

*Covers: Weighted Feature-Based Resume Scoring, Vector Space Similarity (cosine) for profile–placement matching, and Logistic Regression–based placement prediction as product intent for Orbiton.*
