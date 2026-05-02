-- 002_pgvector.sql
-- Enable the pgvector extension and add embedding columns + HNSW indexes
-- for student profiles and drives. Idempotent: safe to re-run.

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
-- profile_embedding holds the dense vector (default model = all-mpnet-base-v2 = 768d).
-- If you change EMBEDDING_DIM in the Python services, update the column type here
-- and recreate the index. We keep the dimension in app config so Python services
-- can validate before insert.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS profile_embedding vector(768),
  ADD COLUMN IF NOT EXISTS skills_normalized text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS embedding_model_version text,
  ADD COLUMN IF NOT EXISTS embedding_computed_at timestamptz;

-- HNSW index for cosine similarity (fast approximate nearest neighbour).
-- m + ef_construction trade build-time vs recall; defaults are good for ~100k rows.
CREATE INDEX IF NOT EXISTS idx_students_profile_embedding_hnsw
  ON students
  USING hnsw (profile_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for the normalized skills array, used by boolean prefilter.
CREATE INDEX IF NOT EXISTS idx_students_skills_normalized_gin
  ON students
  USING gin (skills_normalized);

-- ---------------------------------------------------------------------------
-- Drives
-- ---------------------------------------------------------------------------
ALTER TABLE drives
  ADD COLUMN IF NOT EXISTS jd_embedding vector(768),
  ADD COLUMN IF NOT EXISTS required_skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_cgpa numeric(4,2),
  ADD COLUMN IF NOT EXISTS min_experience_years numeric(4,2),
  ADD COLUMN IF NOT EXISTS embedding_model_version text,
  ADD COLUMN IF NOT EXISTS embedding_computed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_drives_jd_embedding_hnsw
  ON drives
  USING hnsw (jd_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_drives_required_skills_gin
  ON drives
  USING gin (required_skills);

-- ---------------------------------------------------------------------------
-- Read-only role for the Python services
-- ---------------------------------------------------------------------------
-- Per the architecture rule "Node owns all writes", the Python services connect
-- with this read-only role. Embeddings are written back through Node webhooks.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orbiton_ro') THEN
    CREATE ROLE orbiton_ro WITH LOGIN PASSWORD 'orbiton_ro';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE orbiton TO orbiton_ro;
GRANT USAGE ON SCHEMA public TO orbiton_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO orbiton_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO orbiton_ro;
