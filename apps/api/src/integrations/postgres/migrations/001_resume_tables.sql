-- Resume Analysis tables. Created idempotently; safe to run on every boot.
-- This migration is purely additive: it creates new tables only and does not
-- alter or drop any existing schema.

CREATE TABLE IF NOT EXISTS resume_profiles (
    student_id  TEXT PRIMARY KEY,
    profile     JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_owners (
    resume_id   TEXT PRIMARY KEY,
    student_id  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_owners_student
    ON resume_owners (student_id);

-- Named ml_resume_scores to avoid clashing with infrastructure/db/postgres
-- 001_initial_schema.sql (resume_scores is UUID-keyed there).
CREATE TABLE IF NOT EXISTS ml_resume_scores (
    resume_id           TEXT PRIMARY KEY,
    student_id          TEXT,
    skill_score         NUMERIC(5,2) NOT NULL,
    experience_score    NUMERIC(5,2) NOT NULL,
    completeness_score  NUMERIC(5,2) NOT NULL,
    final_score         NUMERIC(6,2) NOT NULL,
    breakdown           JSONB NOT NULL,
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_resume_scores_student_computed
    ON ml_resume_scores (student_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS resume_uploads (
    upload_id              TEXT PRIMARY KEY,
    student_id             TEXT,
    filename               TEXT,
    content_type           TEXT,
    size_bytes             INTEGER NOT NULL DEFAULT 0,
    storage_key            TEXT,
    extracted_text_length  INTEGER NOT NULL DEFAULT 0,
    uploaded_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_student_uploaded
    ON resume_uploads (student_id, uploaded_at DESC);
