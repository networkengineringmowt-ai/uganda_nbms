DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gis_readonly') THEN CREATE ROLE gis_readonly NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gis_editor') THEN CREATE ROLE gis_editor NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gis_service') THEN CREATE ROLE gis_service NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gis_maintainer') THEN CREATE ROLE gis_maintainer NOLOGIN; END IF;
END $$;

GRANT USAGE ON SCHEMA core, inspection, maintenance, evidence, twin, integration TO gis_readonly, gis_editor, gis_service, gis_maintainer;
GRANT SELECT ON ALL TABLES IN SCHEMA core, inspection, maintenance, evidence, twin, integration TO gis_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core, inspection, maintenance, evidence, twin TO gis_editor;
GRANT SELECT ON ALL TABLES IN SCHEMA integration TO gis_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core, inspection, maintenance, evidence, twin, integration TO gis_maintainer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core, inspection, maintenance, evidence, twin, audit TO gis_editor, gis_maintainer;
