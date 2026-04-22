-- Run as PostgreSQL superuser (typically "postgres") against the "postgres" database.
-- Application login used by this repo on native Windows installs: orbiton_user / password
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orbiton_user') THEN
    CREATE ROLE orbiton_user WITH LOGIN PASSWORD 'password';
  ELSE
    ALTER ROLE orbiton_user WITH LOGIN PASSWORD 'password';
  END IF;
END
$$;
