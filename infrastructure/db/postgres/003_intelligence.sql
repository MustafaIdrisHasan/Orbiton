-- 003_intelligence.sql
-- Audit + result tables for the intelligence layer.
-- All writes happen from the Node API (Python services post results via webhook).

-- ---------------------------------------------------------------------------
-- resume_parses
-- Append-only history of parse runs. Latest row per resume_id is the current
-- canonical parse; UI / API can fetch the most recent by computed_at DESC.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resume_parses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id       uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  status          text NOT NULL CHECK (status IN ('queued','parsing','succeeded','failed')),
  json_resume     jsonb,                       -- JSON Resume schema
  raw_text_chars  integer,                     -- length of extracted text (debug)
  parse_version   text NOT NULL,               -- our pipeline version, e.g. "1.0.0"
  model_version   text NOT NULL,               -- spaCy model + transformer version
  failure_reason  text,
  duration_ms     integer,
  computed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_parses_resume_id
  ON resume_parses (resume_id, computed_at DESC);

-- ---------------------------------------------------------------------------
-- match_runs
-- One row per (student, drive) match calculation. Includes both numeric scores
-- and a JSON explanation payload for the UI's "why" panel.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  drive_id          uuid NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  cosine_similarity numeric(6,5) NOT NULL,
  skill_jaccard     numeric(6,5),
  experience_fit    numeric(6,5),
  cgpa_fit          numeric(6,5),
  composite_score   numeric(6,5) NOT NULL,
  boolean_pass      boolean NOT NULL,
  explanations      jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version     text NOT NULL,
  computed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_runs_student_id
  ON match_runs (student_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_runs_drive_id
  ON match_runs (drive_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_runs_composite_score
  ON match_runs (drive_id, composite_score DESC);

-- ---------------------------------------------------------------------------
-- placement_predictions
-- One row per inference. Append-only. Latest per student_id is the current
-- "Placement Readiness Score".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placement_predictions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id              uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  probability             numeric(6,5) NOT NULL,         -- P(placed) ∈ [0,1]
  risk_band               text NOT NULL CHECK (risk_band IN ('low','medium','high')),
  feature_contributions   jsonb NOT NULL DEFAULT '{}'::jsonb,  -- SHAP / importance per feature
  features_snapshot       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- exact inputs used
  model_version           text NOT NULL,
  computed_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_predictions_student_id
  ON placement_predictions (student_id, computed_at DESC);

-- ---------------------------------------------------------------------------
-- matching_config
-- Per-institution weight configuration for composite matching score.
-- Single row per institution_id; falls back to default row when null.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matching_config (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id          uuid,
  cosine_weight           numeric(4,3) NOT NULL DEFAULT 0.55,
  skill_jaccard_weight    numeric(4,3) NOT NULL DEFAULT 0.25,
  experience_fit_weight   numeric(4,3) NOT NULL DEFAULT 0.10,
  cgpa_fit_weight         numeric(4,3) NOT NULL DEFAULT 0.10,
  enforce_mandatory_skills boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id)
);

-- Seed a global default row.
INSERT INTO matching_config (institution_id) VALUES (NULL)
  ON CONFLICT DO NOTHING;
