CREATE TABLE IF NOT EXISTS core.structure (
  structure_id text PRIMARY KEY CHECK (structure_id ~ '^[BC][0-9]{3}$'),
  structure_type text NOT NULL CHECK (structure_type IN ('bridge', 'culvert')),
  name text,
  road_link_id text,
  road_name text,
  road_class text,
  region text,
  station text,
  condition_rating numeric(4,2) CHECK (condition_rating BETWEEN 0 AND 9),
  length_m numeric(12,3),
  width_m numeric(12,3),
  span_count integer,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom geometry(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS structure_geom_gix ON core.structure USING gist (geom);
CREATE INDEX IF NOT EXISTS structure_properties_gin ON core.structure USING gin (properties);
CREATE INDEX IF NOT EXISTS structure_name_trgm ON core.structure USING gin (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS core.road_link (
  road_link_id text PRIMARY KEY,
  road_no text,
  road_name text,
  road_class text,
  length_km numeric(12,3),
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom geometry(MultiLineString, 4326),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS road_link_geom_gix ON core.road_link USING gist (geom);

CREATE TABLE IF NOT EXISTS inspection.inspection (
  inspection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id text NOT NULL REFERENCES core.structure(structure_id),
  inspection_type text NOT NULL,
  inspected_at timestamptz NOT NULL,
  inspector text,
  overall_rating numeric(4,2) CHECK (overall_rating BETWEEN 0 AND 9),
  component_ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inspection_structure_date_idx ON inspection.inspection (structure_id, inspected_at DESC);

CREATE TABLE IF NOT EXISTS maintenance.work_order (
  work_order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id text NOT NULL REFERENCES core.structure(structure_id),
  priority integer NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  work_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned',
  estimated_cost_ugx numeric(18,2),
  contractor text,
  planned_start date,
  planned_finish date,
  actual_finish date,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence.media (
  media_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id text REFERENCES core.structure(structure_id),
  inspection_id uuid REFERENCES inspection.inspection(inspection_id),
  object_key text NOT NULL UNIQUE,
  original_path text,
  filename text NOT NULL,
  capture_time timestamptz,
  capture_year integer,
  sequence_no integer,
  media_type text NOT NULL DEFAULT 'photo',
  checksum_sha256 text,
  match_method text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom geometry(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_structure_idx ON evidence.media (structure_id, capture_year, sequence_no);
CREATE INDEX IF NOT EXISTS media_geom_gix ON evidence.media USING gist (geom);

CREATE TABLE IF NOT EXISTS twin.reconstruction (
  reconstruction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id text NOT NULL REFERENCES core.structure(structure_id),
  source_media_ids uuid[] NOT NULL DEFAULT '{}',
  point_cloud_object_key text,
  mesh_object_key text,
  status text NOT NULL DEFAULT 'queued',
  coordinate_reference_system text,
  control_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  quality_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  certified_dimensions boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit.change_log (
  change_id bigserial PRIMARY KEY,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by text NOT NULL DEFAULT current_user,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL,
  record_key text,
  before_row jsonb,
  after_row jsonb
);

CREATE OR REPLACE FUNCTION audit.capture_row_change() RETURNS trigger AS $$
DECLARE
  before_json jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  after_json jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
BEGIN
  INSERT INTO audit.change_log(schema_name, table_name, operation, record_key, before_row, after_row)
  VALUES (
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(after_json->>'structure_id', before_json->>'structure_id', after_json->>'inspection_id', before_json->>'inspection_id', after_json->>'work_order_id', before_json->>'work_order_id'),
    before_json,
    after_json
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS structure_audit ON core.structure;
CREATE TRIGGER structure_audit AFTER INSERT OR UPDATE OR DELETE ON core.structure FOR EACH ROW EXECUTE FUNCTION audit.capture_row_change();
DROP TRIGGER IF EXISTS inspection_audit ON inspection.inspection;
CREATE TRIGGER inspection_audit AFTER INSERT OR UPDATE OR DELETE ON inspection.inspection FOR EACH ROW EXECUTE FUNCTION audit.capture_row_change();
DROP TRIGGER IF EXISTS work_order_audit ON maintenance.work_order;
CREATE TRIGGER work_order_audit AFTER INSERT OR UPDATE OR DELETE ON maintenance.work_order FOR EACH ROW EXECUTE FUNCTION audit.capture_row_change();
DROP TRIGGER IF EXISTS media_audit ON evidence.media;
CREATE TRIGGER media_audit AFTER INSERT OR UPDATE OR DELETE ON evidence.media FOR EACH ROW EXECUTE FUNCTION audit.capture_row_change();
DROP TRIGGER IF EXISTS reconstruction_audit ON twin.reconstruction;
CREATE TRIGGER reconstruction_audit AFTER INSERT OR UPDATE OR DELETE ON twin.reconstruction FOR EACH ROW EXECUTE FUNCTION audit.capture_row_change();
