-- Run as superuser on database "orbiton" after 001_initial_schema.sql (applied as postgres).
-- Objects created by the superuser are owned by postgres; the app connects as orbiton_user.
-- REASSIGN OWNED BY postgres is not allowed (system objects), so transfer public DDL explicitly.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles u ON u.oid = c.relowner
    WHERE n.nspname = 'public'
      AND u.rolname = 'postgres'
      AND c.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
  LOOP
    IF rec.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE public.%I OWNER TO orbiton_user', rec.relname);
    ELSIF rec.relkind = 'v' THEN
      EXECUTE format('ALTER VIEW public.%I OWNER TO orbiton_user', rec.relname);
    ELSIF rec.relkind = 'm' THEN
      EXECUTE format('ALTER MATERIALIZED VIEW public.%I OWNER TO orbiton_user', rec.relname);
    ELSIF rec.relkind = 'f' THEN
      EXECUTE format('ALTER FOREIGN TABLE public.%I OWNER TO orbiton_user', rec.relname);
    ELSE
      EXECUTE format('ALTER TABLE public.%I OWNER TO orbiton_user', rec.relname);
    END IF;
  END LOOP;
END
$$;

ALTER SCHEMA public OWNER TO orbiton_user;
