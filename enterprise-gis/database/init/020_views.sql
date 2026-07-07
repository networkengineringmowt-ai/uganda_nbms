CREATE OR REPLACE VIEW integration.structure_ogc AS
SELECT structure_id, structure_type, name, road_link_id, road_name, road_class, region, station,
       condition_rating, length_m, width_m, span_count, properties, geom, updated_at
FROM core.structure;

CREATE OR REPLACE VIEW integration.priority_structures AS
SELECT s.*, COUNT(w.work_order_id) FILTER (WHERE w.status NOT IN ('closed', 'cancelled')) AS open_work_orders
FROM core.structure s
LEFT JOIN maintenance.work_order w USING (structure_id)
WHERE s.condition_rating <= 4 OR EXISTS (
  SELECT 1 FROM maintenance.work_order wo WHERE wo.structure_id = s.structure_id AND wo.priority <= 2 AND wo.status NOT IN ('closed', 'cancelled')
)
GROUP BY s.structure_id;

CREATE OR REPLACE VIEW integration.latest_inspection AS
SELECT DISTINCT ON (structure_id) structure_id, inspection_id, inspection_type, inspected_at, inspector, overall_rating, component_ratings, findings, status
FROM inspection.inspection
ORDER BY structure_id, inspected_at DESC;

CREATE OR REPLACE VIEW integration.twin_readiness AS
SELECT s.structure_id, s.structure_type, s.name, s.length_m, s.width_m, s.span_count,
       COUNT(m.media_id) FILTER (WHERE m.media_type = 'photo') AS photo_count,
       MAX(r.status) AS reconstruction_status,
       BOOL_OR(COALESCE(r.certified_dimensions, false)) AS has_certified_dimensions
FROM core.structure s
LEFT JOIN evidence.media m USING (structure_id)
LEFT JOIN twin.reconstruction r USING (structure_id)
GROUP BY s.structure_id;
