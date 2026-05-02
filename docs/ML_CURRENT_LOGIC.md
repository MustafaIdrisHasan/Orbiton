# Orbiton — ML modules: current logic, architecture, and contracts

> **Audience:** an external reviewer (e.g. Gemini) doing a code/design review.
> **Scope:** the three intelligence modules that are wired today —
> **Resume Analysis**, **Job ↔ Profile Matching**, and **Placement Prediction**.
>
> This document describes **what is actually implemented**, not what is planned.
> The aspirational spec lives in `docs/ML_PRODUCT_SPEC.md`.

---

## 0. High-level architecture

### Services

| Service | Tech | Port | Role |
|---|---|---|---|
| `apps/web` | React (Vite) | 5173 | UI (student / TPO / recruiter dashboards) |
| `apps/api` | Node.js + Express | 5000 | Public REST API, auth, RBAC, persistence, in-process resume scoring + matching |
| `apps/ml-service` | Python + Flask | 8000 | Pure-Python logistic regression for placement prediction |
| Postgres | 16 (Docker) | 5432 | Persistence for resume profiles, scores, uploads |

### Module ownership

| Module | Compute lives in | DB tables touched |
|---|---|---|
| Resume Analysis | **Express (Node)** — `apps/api/src/modules/resumes/scoring/` | `resume_profiles`, `resume_owners`, `ml_resume_scores`, `resume_uploads` |
| Matching | **Express (Node)** — `apps/api/src/modules/matching/` | (read-only over in-memory `recruiterStore` and the resume profile store) |
| Placement Prediction | **Flask (Python)** — `apps/ml-service/inference.py`; orchestration in **Express** — `apps/api/src/modules/predictions/` and `apps/api/src/integrations/intelligence/index.js` | (none directly; inputs come from the resume profile store + recruiter mock) |

### Request flow

```mermaid
flowchart LR
  Web["apps/web (React)"]
  API["apps/api (Express)"]
  ML["apps/ml-service (Flask)"]
  PG[("Postgres")]

  Web -->|JWT| API
  API -->|POST /v1/predict/placement\n(timeout 2s, circuit breaker)| ML
  API -->|setProfile / setScore / getScore| PG
  Web -->|GET /matching/drives, /matching/students| API
  Web -->|POST /resumes/upload (multipart)| API
  Web -->|POST /predictions/placement (TPO)| API
```

### Feature flags (env)

All three modules are gated. Flags live in `apps/api/src/config/env.js`:

```javascript
features: {
  resumeScoring: flag("ENABLE_RESUME_SCORING"),
  matching:      flag("ENABLE_MATCHING"),
  prediction:    flag("ENABLE_PREDICTION")
}
```

When a flag is **off**, every route in that module returns **404** (router-level guard). Tests assert this.

### RBAC (role gates on the routes)

| Route | Roles |
|---|---|
| `PUT /api/v1/resumes/me/profile` | any authenticated (the controller uses the JWT's `userId` as `studentId`) |
| `POST /api/v1/resumes/:id/analyze` | any authenticated |
| `GET /api/v1/resumes/:id/score` | any authenticated |
| `POST /api/v1/resumes/upload` | any authenticated |
| `GET /api/v1/students/profile/me/full` | any authenticated |
| `GET /api/v1/matching/drives` | any authenticated (acts on the JWT's `userId`) |
| `GET /api/v1/matching/students?driveId=…` | **TPO** or **RECRUITER** only |
| `POST /api/v1/predictions/placement` | **TPO** or **RECRUITER** only |

---

## 1. Resume Analysis — weighted feature-based scorer

> **Goal:** Score a student's resume on a 0–100 scale and explain the score with sub-scores and tips. The score must persist and feed downstream modules.

### 1.1 Inputs & data sources

A `profile` object is the single source of truth for scoring. Two ways to populate it:

1. **Structured profile** — `PUT /api/v1/resumes/me/profile`. Body shape:
   ```json
   {
     "skills": ["React", "Node.js", "SQL"],
     "education": { "cgpa": 8.6, "branch": "CSE", "degree": "B.Tech", "year": "Final Year" },
     "projects":  [{ "title": "...", "description": "...", "tech": ["React","Node.js"] }],
     "experience":[{ "role": "SDE Intern", "durationMonths": 6, "internship": true }],
     "backlogs": 0
   }
   ```
2. **PDF upload** — `POST /api/v1/resumes/upload` (multipart, field `file`). The handler:
   1. Caps file size at **5 MB** (Multer).
   2. Extracts text via **`pdf-parse`** (best-effort; failure → empty string).
   3. Sniffs skills with a deterministic keyword scan against a hardcoded list `SKILL_HINTS` (24 tokens including `react`, `node.js`, `python`, `sql`, `docker`, etc.).
   4. Builds a profile of the form `{ skills, education: {}, projects: [], experience: [], extractedTextLength }`.
   5. Persists the profile under the student id, runs the scorer, and persists the score.

> **Important limitation.** The PDF parser is intentionally a *skill sniffer*, not a section parser. CGPA, branch, projects, and experience are **not** extracted from the PDF; they must come from the structured profile. This is by design (deterministic, no LLM calls), but it is the single most-asked-about behaviour.

### 1.2 Scoring formulas

All sub-scores are clamped to `[0, 1]`; the final score is `100 × Σ wᵢ · sᵢ`, rounded to one decimal.

**Code:** `apps/api/src/modules/resumes/scoring/features.js` and `scorer.js`.

#### 1.2.1 Skills (`weight = 0.30`)

```
countScore = clamp01(N / 12)       // N = total skills
diversity  = clamp01(unique / 10)  // unique skills
keywordMatch = |target ∩ unique| / |target|   // only when target provided

if target.length > 0:
    score = clamp01(0.4·count + 0.3·diversity + 0.3·keywordMatch)
else:
    score = clamp01((0.4·count + 0.3·diversity) / 0.7)   // renormalize
```
`target` comes from `ctx.targetSkills` (e.g. drive's `requiredSkills`); when scoring without a drive context, only count + diversity contribute.

#### 1.2.2 Education (`weight = 0.15`)

```
cgpaScore  = clamp01((cgpa − 5) / 5)         // 5.0 → 0; 10.0 → 1
relevance  = 1 if branch ∈ eligibleDepartments else 0.4 (when context is present)

if eligibleDepartments present:
    score = clamp01(0.7·cgpaScore + 0.3·relevance)
else:
    score = clamp01(cgpaScore)
```

#### 1.2.3 Projects (`weight = 0.20`)

```
countScore = clamp01(P / 4)                  // P = number of projects
relevance  = (count of targetSkills mentioned in title/description/tech blob) / |target|

if target.length > 0:
    score = clamp01(0.6·count + 0.4·relevance)
else:
    score = clamp01(count)
```

#### 1.2.4 Experience (`weight = 0.20`)

```
internshipScore = clamp01(internshipMonths / 6)
totalScore      = clamp01(totalMonths / 12)
score           = clamp01(0.6·internshipScore + 0.4·totalScore)
```
Internships are weighted higher than non-internship roles for a campus context.

#### 1.2.5 Completeness (`weight = 0.15`)

```
sectionsPresent = subset of {skills, education, projects, experience} that are non-empty
score           = |sectionsPresent ∩ REQUIRED_SECTIONS| / |REQUIRED_SECTIONS|
                = sectionsPresent.length / 4
```
`REQUIRED_SECTIONS` is `["skills","education","projects","experience"]`.

#### 1.2.6 Tips (deterministic, no ML)

The scorer also returns a `tips` array, e.g.:
- "Add more relevant skills (aim for 8 or more)."
- "Showcase at least two substantial projects with measurable outcomes."
- "Add an internship or relevant work experience to strengthen credibility."
- "Complete missing sections: …"
- "CGPA is below typical eligibility cutoffs; …"

### 1.3 Output shape

```json
{
  "modelVersion": "rs-v0.1.0",
  "computedAt":   "2026-04-25T21:51:23.014Z",
  "weights":      { "skills": 0.3, "education": 0.15, "projects": 0.2, "experience": 0.2, "completeness": 0.15 },
  "subscores": {
    "skills":       { "score": 0.91, "weight": 0.3, "details": { "count": 10, "uniqueCount": 10, "diversity": 1, "keywordMatch": 0, "matched": [] } },
    "education":    { "score": 0,    "weight": 0.15, "details": { "cgpa": null, "degree": null, "branch": null, "relevance": 0 } },
    "projects":     { "score": 0,    "weight": 0.2, "details": { "count": 0, "relevance": 0 } },
    "experience":   { "score": 0,    "weight": 0.2, "details": { "totalMonths": 0, "internshipMonths": 0, "hasInternship": false } },
    "completeness": { "score": 0.25, "weight": 0.15, "details": { "sections": ["skills"], "missingSections": ["education","projects","experience"], "coverage": 0.25 } }
  },
  "finalScore": 30.9,
  "tips": [ "...", "..." ]
}
```

### 1.4 Persistence

`apps/api/src/modules/resumes/store.js` is a dispatcher that picks the backend at request time based on `USE_POSTGRES`. Both backends implement the **identical async surface**: `setProfile / getProfile / setScore / getScore / setResumeForStudent / getStudentForResume / getLatestScoreForStudent / recordUpload / getUpload`.

#### 1.4.1 In-memory backend (`store.memory.js`)

Four `Map`s keyed by `studentId` or `resumeId`. Used when `USE_POSTGRES` is false (e.g. tests).

#### 1.4.2 Postgres backend (`store.postgres.js`)

Migration `apps/api/src/integrations/postgres/migrations/001_resume_tables.sql` creates these tables idempotently on first call:

| Table | Key | Notable columns |
|---|---|---|
| `resume_profiles` | `student_id` (PK) | `profile JSONB`, `updated_at` |
| `resume_owners` | `resume_id` (PK) | `student_id`, indexed |
| `ml_resume_scores` | `resume_id` (PK) | `student_id`, `skill_score`, `experience_score`, `completeness_score`, `final_score`, `breakdown JSONB`, `computed_at` |
| `resume_uploads` | `upload_id` (PK) | `filename`, `content_type`, `size_bytes`, `storage_key`, `extracted_text_length`, `uploaded_at` |

> **Naming note.** `ml_resume_scores` is intentionally named differently from the legacy `resume_scores` table in `infrastructure/db/postgres/001_initial_schema.sql` to avoid colliding with that schema while leaving the migration purely additive.
>
> **Storage caveat.** The `storage_key` column is a *path*, not a real bucket key — the PDF bytes themselves are **not** persisted to S3/disk yet; only the parsed text length and the resulting score are stored. This is OK for the analysis pipeline but is a known follow-up.

### 1.5 HTTP contract

| Method | Path | Body | Returns |
|---|---|---|---|
| `PUT` | `/api/v1/resumes/me/profile` | profile object | `{ success, data: { studentId, profile, updatedAt } }` |
| `POST` | `/api/v1/resumes/:id/analyze` | optional `{ profile?, context? }` | full score object (see §1.3) |
| `GET` | `/api/v1/resumes/:id/score` | — | persisted score for that resumeId |
| `POST` | `/api/v1/resumes/upload` | multipart `file` (PDF) | `{ uploadId, upload, profile, score, backend, persisted }` |
| `GET` | `/api/v1/students/profile/me/full` | — | aggregated profile + `resumeScore` + `latestResumeId` + `modelVersion` |

> `GET /api/v1/students/profile/me` (note: **no `/full`**) is **never** changed — it returns a fixed mock payload to keep older clients working. All extended fields live behind `/full`.

### 1.6 Worked example (real run on a 94 KB CV PDF)

Input: PDF with no detectable CGPA / projects / experience.

```
extractedTextLength : 3942
inferred skills     : react, javascript, python, java, sql, docker, rest, redis, git, linux  (10)
subscores           : skills 0.905 | education 0 | projects 0 | experience 0 | completeness 0.25
finalScore          : 30.9
```

After enriching the same `studentId` via `PUT /resumes/me/profile` with `cgpa = 8.4`, `branch = CSE`, 2 projects, 1 internship of 6 months:

```
finalScore  : 81.2
```

The score reacts in the right direction for the right inputs — no surprises.

### 1.7 Test coverage

`apps/api/src/tests/resume-scoring.test.js` and `resume-routes.test.js` (Node `node:test`). Cover:

- Top-level shape & `modelVersion`.
- Default weights sum to **1.0**.
- Strong profile ⇒ `finalScore ≥ 70`; empty profile ⇒ `finalScore = 0` and 4 missing sections.
- All sub-scores in `[0, 1]`, weights in `(0, 1]`.
- Keyword match raises skills score when `targetSkills` provided.
- Out-of-department lowers education score.
- Internship presence beats no experience.
- Completeness exactly equals coverage / 4.
- Full HTTP round trip with `USE_POSTGRES=false` (in-memory store) for hermeticity.
- 404 when flag is off; existing `/students/profile/me` payload shape **unchanged** with flag on or off (regression guard).

---

## 2. Job ↔ Profile Matching — vector space + cosine similarity

> **Goal:** Rank drives for a given student (and students for a given drive) using a transparent vector similarity score with explainability.

### 2.1 Vocabulary

`apps/api/src/modules/matching/vocabulary.js` builds a global, version-tagged vocabulary on first use and caches it:

- `version: "v1"`.
- `skills`: lowercase, deduplicated union of `BASELINE_SKILLS` (17 entries) + every `requiredSkill` on every drive in the recruiter store + every skill on every candidate.
- `branches`: uppercase, deduplicated union of `BASELINE_BRANCHES` (8 entries: `CSE, IT, ECE, EEE, MECH, CIVIL, AIDS, AIML`) + every `eligibleDepartment` and every candidate `branch`.
- `dim() = skills.length + branches.length` — both student and drive vectors live in this fixed-length space.

A test helper `_resetForTests()` is provided to clear the cache between tests.

### 2.2 Encoding (`encoder.js`)

Both encoders produce a binary vector of length `vocab.dim()`:

- **`encodeStudent(profile, vocab)`:**
  - Normalize `profile.skills` to lowercase, build a set.
  - Set `v[i] = 1` for each `vocab.skills[i]` that is in the student's skill set.
  - Branch: take `profile.education.branch || profile.department || profile.branch`, uppercase, set the corresponding branch slot to 1.
- **`encodeDrive(drive, vocab)`:**
  - Same logic against `drive.requiredSkills` (skills) and `drive.eligibleDepartments` (branches).

This is a **multi-hot binary encoding** (binary skills + multi-hot eligible departments), explicitly chosen for transparency and zero training data requirement.

### 2.3 Similarity (`similarity.js`)

Pure JavaScript cosine, with explicit defenses:

```javascript
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return 0;
  const denom = norm(a) * norm(b);
  if (denom === 0) return 0;            // zero-norm safe — never returns NaN
  return dot(a, b) / denom;
}
```

`dot` and `norm` are stand-alone helpers and unit-tested.

### 2.4 Explainability — `topContributingDimensions`

For each `(student, drive)` pair the service also returns `topContributingDimensions` — the **intersection** of the two vectors over the **skill** axes only (not branches), capped at `limit = 5`. This is the human-readable "why this match" payload that the spec requires.

### 2.5 Service-level orchestration (`service.js`)

#### 2.5.1 Drives ranked for a student

`rankDrivesForStudent(studentId)`:

1. Load the student's profile from `resumeStore.getProfile(studentId)`. If absent, fall back to a hardcoded **demo profile** (`React, Node.js, SQL, System design`, `CSE`, CGPA 8.6) so the endpoint is always non-empty in dev.
2. Encode student.
3. For each drive returned by `drivesService.listDrives()`:
   - Encode drive.
   - Compute cosine similarity.
   - Compute `topContributingDimensions`.
4. Sort items **descending by similarity** and return:
   ```json
   {
     "vocabularyVersion": "v1",
     "studentId": "...",
     "items": [
       { "driveId":"...", "title":"...", "companyName":"...",
         "similarity": 0.4714, "matchPercent": 47,
         "topContributingDimensions": ["node.js","react","sql"] }
     ]
   }
   ```

#### 2.5.2 Students ranked for a drive

`rankStudentsForDrive(driveId)`:

1. Look up the drive; if missing, return `null` ⇒ controller responds **404**.
2. Build a flat list of unique candidates by walking `recruiterStore.drives[*].candidates[*]` (deduped by `id`).
3. Encode each candidate as a "student", encode the drive once, score & sort.

### 2.6 HTTP contract

| Method | Path | Roles | Notes |
|---|---|---|---|
| `GET` | `/api/v1/matching/drives` | any auth | studentId from `?studentId=` or JWT |
| `GET` | `/api/v1/matching/students?driveId=…` | TPO / RECRUITER | 400 if `driveId` missing; 404 if drive not found |

### 2.7 Test coverage

`apps/api/src/tests/matching.test.js`:

- **Math invariants:** identical vectors → 1; orthogonal → 0; zero-norm safe; empty arrays safe.
- **Encoder invariants:** `encodeStudent` and `encodeDrive` produce same-length vectors of `vocab.dim()`.
- **Ranking property:** an "aligned" student outranks an "unaligned" student against the same drive.
- **Explainability:** `topContributingDimensions` returns intersected skills only, never disjoint ones.
- **Routing:** flag off → 404; flag on → 200 with descending-similarity items, `matchPercent`, `topContributingDimensions`.
- **RBAC:** a STUDENT calling `/matching/students` gets **403**.

---

## 3. Placement Outcome Prediction — logistic regression baseline

> **Goal:** Estimate placement probability (and a 3-band risk label) for a student, with interpretable feature contributions, served by the ML service.

### 3.1 Where the math lives

`apps/ml-service/inference.py` is **pure Python + math** (no scikit-learn at runtime). It does try to load `model.joblib` next to itself; if the file is absent or `joblib` is not installed, it falls back to `DEFAULT_COEFS` so the service always responds.

### 3.2 Feature normalization

Every input is mapped to `[0, 1]`:

| Input | Normalization |
|---|---|
| `resumeScore` (0–100) | `rs = clamp01(rs/100)` |
| `cgpa` (0–10) | `cgpa = clamp01((cgpa − 5) / 5)`  (CGPA 5 → 0, CGPA 10 → 1) |
| `hasInternship` | `1.0` if truthy else `0.0` |
| `projectCount` | `clamp01(p/4)` |
| `backlogs` | `clamp01(b/3)` (penalty term) |

Missing inputs default to `0.0` — the API echoes the assembled payload back in the response so callers can see exactly what was used.

### 3.3 Coefficients (default baseline)

```python
DEFAULT_COEFS = {
  "intercept": -1.5,
  "weights": {
    "resume_score":  2.0,
    "cgpa":          2.5,
    "internship":    0.8,
    "projects":      1.2,
    "backlogs":     -1.5,
  },
  "model_version": "pp-v0.1.0",
}
```

### 3.4 Scoring

```
z           = intercept + Σ wᵢ · xᵢ
probability = σ(z) = 1 / (1 + e^(−z))         (numerically-stable two-branch impl)
contributions[i] = wᵢ · xᵢ                   (the attribution payload)
```

### 3.5 Risk band

```
band = "high"   if probability ≥ 0.70
band = "medium" if probability ≥ 0.40
band = "low"    otherwise
```

### 3.6 Output shape (Flask)

```json
{
  "probability":  0.96,
  "riskBand":     "high",
  "modelVersion": "pp-v0.1.0",
  "intercept":    -1.5,
  "features":     { "resume_score": 0.812, "cgpa": 0.68, "internship": 1.0, "projects": 0.5, "backlogs": 0.0 },
  "contributions":{ "resume_score": 1.624, "cgpa": 1.7,  "internship": 0.8, "projects": 0.6, "backlogs": 0.0 }
}
```

### 3.7 Express orchestration

`apps/api/src/modules/predictions/service.js` builds the feature payload server-side:

1. Resolve `studentId` from body / query / JWT.
2. Load `profile` from `resumeStore.getProfile(studentId)`; pull `cgpa`, project count, internship flag, backlogs.
3. Load latest persisted score with `resumeStore.getLatestScoreForStudent(studentId)` → `resumeScore`.
4. If no profile exists, fall back to the recruiter mock store candidate row (so the demo always works).
5. Apply per-field overrides from the request body (TPO can experiment with hypothetical inputs).
6. Call `intelligence.predictPlacement(payload)`.

The integration in `apps/api/src/integrations/intelligence/index.js` adds two production-grade behaviors:

- **Per-call timeout: 2,000 ms.** Implemented via `AbortController`. Timeouts return `{ available:false, reason:"TIMEOUT" }`.
- **Circuit breaker:** consecutive failure threshold **3**, open duration **30 s**. While open, calls short-circuit immediately with `{ available:false, reason:"CIRCUIT_OPEN" }` — no wasted network.

### 3.8 HTTP contract (Express)

| Method | Path | Roles | Behaviour |
|---|---|---|---|
| `POST` | `/api/v1/predictions/placement` | TPO / RECRUITER | 200 on success; **503** when the ML service is unavailable, with the `payload` echoed so the UI can degrade gracefully |

### 3.9 UI degradation

`apps/web/src/features/tpo/PlacementPredictionWidget.jsx` calls `predictPlacement()` (in `shared/api/predictions.js`). On the sentinel `PREDICTION_UNAVAILABLE` error, the widget **hides itself** rather than showing a broken card. This is the user-visible expression of the 503 semantics.

### 3.10 Test coverage

- **Python (`apps/ml-service/tests/test_inference.py`):** documented shape, bands respond to inputs, missing payload doesn't crash, `model_info` reports version + load source.
- **Node (`apps/api/src/tests/predictions.test.js`):**
  - 404 when flag is off; 200 against a stub ML service with the documented shape.
  - **503** + echoed payload when ML is unreachable.
  - **Circuit breaker** opens after 3 consecutive failures.
  - **403** for STUDENT — TPO/RECRUITER only.

---

## 4. Cross-cutting design notes

### 4.1 Auth model

JWT-based. The token contains `userId`, `role`, **and** `roles[]` (array). All ML routes resolve the actor's `userId` for `studentId` and use `roles[]` for RBAC checks.

### 4.2 Why two persistence backends?

- **In-memory** keeps the test suite hermetic — no Postgres required to assert behaviour.
- **Postgres** is the production path; the dispatcher (`store.js`) selects per-request via `USE_POSTGRES`. Both backends expose **byte-equivalent** return shapes.

### 4.3 Why is the resume scoring in Node, not Python?

Resume scoring is a deterministic weighted sum with no learned model. Doing it in-process inside Express:

- Removes a network hop and a process from the critical path.
- Lets the API persist the score atomically with the profile update.
- Keeps the ML service responsible only for things that genuinely need Python (the logistic regression model, future scikit-learn pipelines).

### 4.4 Why a circuit breaker on prediction?

A flaky ML service must never slow down the rest of the API. The breaker bounds tail latency to a single 2 s timeout, then 30 s of instant 503s, with self-healing via half-open. This is also why the front-end widget hides itself on `PREDICTION_UNAVAILABLE` rather than retrying.

### 4.5 OpenAPI

`packages/openapi/openapi.yaml` declares all four resume routes plus matching and predictions under `/resumes/*`, `/matching/*`, `/predictions/*`. Tagged `Resumes`, `Matching`, `Predictions` for grouping.

### 4.6 What's intentionally **not** implemented yet

- **PDF section parser** for CGPA, branch, projects, experience (today only skills are sniffed).
- **Drive-context-aware resume scoring** is supported by `score(profile, ctx)` but is not yet plumbed into the upload route — the upload always scores with empty `ctx`.
- **Deduplication of duplicate drives** in the recruiter mock data — the current matching response contains repeats because the seed data does. (Production swap to real `drives` repo will fix this.)
- **Object storage for the PDF bytes** — `storage_key` is generated but the bytes are not uploaded anywhere.
- **TF-IDF / learned embeddings** for matching — current encoding is binary multi-hot.
- **Bias / calibration audits** for the prediction model — required by the product spec before student-facing exposure; today only TPOs/recruiters can call it.
- **Trained `model.joblib`** — the service ships only the hand-tuned `DEFAULT_COEFS`.

### 4.7 Known weaknesses worth a reviewer's eye

1. **Cold-start defaults** in the matching service (hardcoded demo profile when none exists) can mask missing-data bugs in dev. Consider returning an empty result with a `reason: "NO_PROFILE"` instead.
2. **Skill keyword sniffer** is case-sensitive only on lowercase comparisons but doesn't handle hyphens / dots inconsistently (`node.js` vs `nodejs` vs `node-js`). Consider a small synonym table.
3. **`storage_key` without storage** is misleading. Either persist to a bucket or rename the column to `storage_key_planned`.
4. **`ml_resume_scores.skill_score`/`experience_score`/`completeness_score`** stores **3 of 5** sub-scores at the top level. The other two (`education`, `projects`) live only inside `breakdown JSONB`. Consider a single `subscores JSONB` column instead, or store all five.
5. **Same-similarity tiebreaker** in matching is array-stable JS sort — fine, but it produces visible duplicate entries when seed data has duplicate drives. Prefer dedup-before-rank.
6. **No model registry**. `modelVersion` is a string constant. Future trained versions should write to a real `model_registry` table with `trained_at`, `dataset_hash`, `metrics`.
7. **Privacy / retention.** Resume PDF text length is stored, but there is no retention policy or redaction step, and the structured profile includes potentially sensitive fields (CGPA, internship history). The spec calls this out; the implementation does not enforce it yet.
8. **Logistic regression coefficients are unvalidated.** They produce reasonable bands on synthetic inputs (we verified low/medium/high boundaries) but have not been calibrated against any historical placement dataset.

---

## 5. End-to-end smoke test (reference)

The following sequence exercises **all three** modules against a running stack
(`USE_POSTGRES=true`, all three feature flags `true`, Flask up on `:8000`):

```powershell
$base = "http://127.0.0.1:5000/api/v1"
$student = (Invoke-RestMethod "$base/session/demo-token?role=STUDENT").data.token
$tpo     = (Invoke-RestMethod "$base/session/demo-token?role=TPO").data.token

# (1) Upload PDF -> auto-scored
& curl.exe -s -X POST "$base/resumes/upload" -H "Authorization: Bearer $student" -F "file=@`"path\to\resume.pdf`";type=application/pdf"

# (2) Enrich structured fields the PDF parser does not extract
$body = @{
  skills = @("react","node.js","sql","typescript","python","docker")
  education = @{ cgpa = 8.4; branch = "CSE"; degree = "B.Tech" }
  projects = @(@{ title="Campus portal"; tech=@("React","Node.js") })
  experience = @(@{ role="SDE Intern"; durationMonths=6; internship=$true })
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method PUT "$base/resumes/me/profile" `
  -Headers @{ Authorization = "Bearer $student"; "Content-Type" = "application/json" } -Body $body

# (3) Re-analyze (any resumeId; the latest score wins downstream)
Invoke-RestMethod -Method POST "$base/resumes/run-1/analyze" `
  -Headers @{ Authorization = "Bearer $student"; "Content-Type" = "application/json" } -Body "{}"

# (4) Matching
Invoke-RestMethod "$base/matching/drives" -Headers @{Authorization="Bearer $student"}

# (5) Prediction (TPO only)
Invoke-RestMethod -Method POST "$base/predictions/placement" `
  -Headers @{Authorization="Bearer $tpo"; "Content-Type"="application/json"} `
  -Body (@{ studentId = "demo-user" } | ConvertTo-Json)
```

Expected end state, on real demo data we ran:
- (1) `finalScore` ≈ **30** (skills only).
- (3) `finalScore` jumps to ≈ **80** after enrichment (CGPA + projects + internship).
- (4) Drives ranked descending; top items expose `topContributingDimensions = ["node.js","react","sql"]`.
- (5) `available: true`, `probability ≈ 0.96`, `riskBand: "high"`, with per-feature `contributions`.

---

## 6. Files of interest (review checklist)

```
apps/api/src/config/env.js                                        # feature flags
apps/api/src/modules/index.js                                     # router mount points
apps/api/src/modules/resumes/index.js                             # resume routes
apps/api/src/modules/resumes/upload.js                            # PDF upload + skill sniffer
apps/api/src/modules/resumes/scoring/{features,scorer,weights}.js # the model
apps/api/src/modules/resumes/store.{js,memory.js,postgres.js}     # persistence
apps/api/src/integrations/postgres/migrations/001_resume_tables.sql
apps/api/src/modules/matching/{vocabulary,encoder,similarity,service,controller,index}.js
apps/api/src/modules/predictions/{service,controller,index}.js
apps/api/src/integrations/intelligence/index.js                   # circuit breaker
apps/ml-service/app.py
apps/ml-service/inference.py                                      # logistic regression
apps/api/src/tests/{resume-scoring,resume-routes,matching,predictions,ml-scaffolding}.test.js
apps/ml-service/tests/test_inference.py
packages/openapi/openapi.yaml                                     # contracts
docs/ML_PRODUCT_SPEC.md                                           # aspirational spec
docs/HANDOVER.md                                                  # project context
```

---

*Document generated against the repo state on 2026-04-26.*
