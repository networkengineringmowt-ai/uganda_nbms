import { FileText, Shield, Database, Component, Key, HardDrive, RefreshCw } from 'lucide-react';

export default function AdminDocumentation() {
  return (
    <div className="admin-docs-root modern-scroll" style={{ overflowY: 'auto', height: '100%', padding: '0' }}>
      <div className="glass-card" style={{ padding: '24px', maxWidth: '100%', margin: '0', borderRadius: '0', minHeight: '100%' }}>
        
        <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <FileText size={28} color="#38bdf8" />
            <h1 style={{ fontSize: '28px', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Enterprise GIS Architecture & Operations Manual</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px', lineHeight: 1.7, maxWidth: '900px' }}>
            Reference documentation for the optional, self-hosted <code style={{ color: '#ec4899' }}>enterprise-gis/</code> Docker Compose stack included in this repository (see <code style={{ color: '#ec4899' }}>docs/ENTERPRISE_GIS_ARCHITECTURE.md</code>). This stack is not what the public MoWT BMS site on GitHub Pages runs on -- that deployment reads the bundled static JSON in <code style={{ color: '#ec4899' }}>public/data/</code> (optionally Supabase). Deploying this stack is a separate, manual step an operator can take to run an authoritative backend.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '32px' }}>
          {/* Service Inventory */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Component size={18} color="#10b981" /> Detailed Service Inventory
            </h2>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Subsystem</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Technology</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Internal Port</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Function</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--text-secondary)' }}>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Gateway</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Nginx 1.27 (Alpine)</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8088 &rarr; 80</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Reverse proxy to every internal service, adds baseline security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy). No TLS termination, rate limiting, or WAF is configured -- add these before exposing the gateway publicly.</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Identity Provider</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Keycloak 26.1</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8080</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Runs in dev mode (start-dev) with a bootstrap admin account. Realm/client/RBAC setup and any SSO federation are configured by the operator, not preconfigured.</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Relational Data</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>PostGIS 16-3.5</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>5432</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ACID transactions, spatial indexing (GIST), JSONB properties columns</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>OGC Publisher</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>GeoServer 2.26.2</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8080</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>WMS/WFS/WMTS, vector tiles and OGC API Features extensions enabled</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>OGC API</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>pygeoapi 0.19.0</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>80</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>OGC API Features/Processes over the PostGIS tables</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Object Storage</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>MinIO RELEASE.2025-02-07</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>9000 / 9001</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>S3-compatible bucket for inspection photos and reality-twin assets</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Backend API</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Node.js / Express (services/catalog-api)</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8080</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Custom REST endpoints and a one-off importer that seeds PostGIS from the repo's public/data JSON</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Tile Cache</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>MapProxy 3.1.0</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8080</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Caches tiles requested through GeoServer</td></tr>
                  <tr><td style={{ padding: '10px 16px' }}>Telemetry</td><td style={{ padding: '10px 16px', color: '#38bdf8' }}>Prometheus v3.2.1 + Grafana 11.5.2</td><td style={{ padding: '10px 16px' }}>9090 / 3000</td><td style={{ padding: '10px 16px' }}>Scrapes the targets defined in observability/prometheus.yml; dashboards and alert rules are set up by the operator, none ship preconfigured</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Database Domain Layout */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Database size={18} color="#a78bfa" /> Database Domain Layout & Schema
            </h2>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#8b5cf6', overflowX: 'auto' }}>
<pre style={{ margin: 0 }}>{`// Entity Relationship Diagram (ERD) Overview
// Matches enterprise-gis/database/init/010_schema.sql

core.structure (structure_id, structure_type, geom, condition_rating, ...)
  ||--o{ inspection.inspection (inspection_id, structure_id, inspector, overall_rating, component_ratings)
  ||--o{ maintenance.work_order (work_order_id, structure_id, priority, status, estimated_cost_ugx)
  ||--o{ evidence.media (media_id, structure_id, ... )
  ||--o{ twin.reconstruction (structure_id, control_points, quality_report, certified_dimensions)

Schemas & Ownership:
- core: Read-heavy, spatially indexed. Master inventory of bridges, culverts and road links.
- inspection: Condition-assessment records, one row per inspection.
- maintenance: Work orders and interventions.
- evidence: Photo/media references (object keys into MinIO).
- twin: Digital-twin reconstruction inputs and quality metadata.
- integration: Reserved for external data-source sync (not yet populated by any script in this repo).
- audit: audit.change_log, populated by a trigger (audit.capture_row_change) on every INSERT/UPDATE/DELETE -- this is real and already wired up in the init scripts.

There is no ml_inference schema or predictive-deterioration model anywhere in this stack -- condition forecasting in the live app is limited to the deterministic weighted-average formulas documented under Administration → Algorithms.`}</pre>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>
              All spatial columns use SRID 4326 (WGS84).
            </p>
          </section>

          {/* Network and Trust Zones */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={18} color="#f59e0b" /> Network & Security Policies
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Edge network:</strong> only the Nginx gateway container maps a host port (<code style={{ color: '#fff' }}>8088 &rarr; 80</code>). GeoServer, pygeoapi, MapProxy, MinIO, Keycloak, pgAdmin, Prometheus and Grafana also join this network so the gateway can reach them, but none of them publish a host port directly. The compose file does not configure TLS -- put a real TLS-terminating proxy in front before exposing this stack past a trusted network.
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '3px solid #38bdf8', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Services network:</strong> internal Docker network shared by the catalog API, GeoServer, pygeoapi, MapProxy, MinIO, Prometheus and Grafana, so they can reach PostGIS and each other by service name (e.g. <code style={{ color: '#fff' }}>postgis:5432</code>).
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Data and identity networks:</strong> declared <code style={{ color: '#fff' }}>internal: true</code> in docker-compose.yml, so containers on them (PostGIS, and Keycloak's own Postgres) have no outbound route at all. MinIO is not on these networks -- it sits on services/edge like the other services.
              </div>
            </div>
          </section>

          {/* Identity & Access Management */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Key size={18} color="#ec4899" /> Identity & Access Management (RBAC)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
              The self-hosted stack includes Keycloak so an operator can centralize authentication and gate the catalog API, GeoServer, and other services behind it -- Keycloak ships in dev mode with no realm, client, or role set up by default, so this requires configuration before it does anything. The public GitHub Pages app is separate: it uses a simple client-side role selection (see the README's Important Limitations) and is not backed by Keycloak.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Role</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Capabilities</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--text-secondary)' }}>
                <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><strong>System Admin</strong></td><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Full access. Keycloak realm management. Database migrations. System parameters.</td></tr>
                <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><strong>Super User / Engineer</strong></td><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Approve inspections, review deficiency-index and asset-valuation outputs, modify structural inventory.</td></tr>
                <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><strong>Inspector (Field)</strong></td><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Submit condition ratings, upload photos (append-only), QField offline sync.</td></tr>
                <tr><td style={{ padding: '8px 12px' }}><strong>Read-Only / Public</strong></td><td style={{ padding: '8px 12px' }}>View public dashboards, basic map layers (WMS), generalized condition reports.</td></tr>
              </tbody>
            </table>
          </section>

          {/* Backup & Disaster Recovery */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <HardDrive size={18} color="#3b82f6" /> Backup & Disaster Recovery (DR)
            </h2>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, paddingLeft: '20px', margin: 0 }}>
              <li><strong style={{ color: '#fff' }}>Enterprise-GIS database dumps:</strong> <code style={{ color: '#38bdf8' }}>scripts/backup.ps1</code> runs <code style={{ color: '#38bdf8' }}>pg_dump -Fc</code> against the postgis container to a local <code style={{ color: '#38bdf8' }}>backups/</code> folder (keeping the most recent 30) and <code style={{ color: '#38bdf8' }}>restore.ps1</code> reverses it with <code style={{ color: '#38bdf8' }}>pg_restore</code>. Both are operator-run scripts -- there is no scheduler, remote/off-site copy, encryption, or WAL archiving configured, so an operator relying on this stack should schedule and offsite these dumps themselves.</li>
              <li><strong style={{ color: '#fff' }}>Live site backup:</strong> the actual thing this repository automates is a GitHub Actions workflow (<code style={{ color: '#38bdf8' }}>Backup on Deploy</code>) that snapshots the repo to a new <code style={{ color: '#38bdf8' }}>backup/&lt;timestamp&gt;</code> branch on every push to <code style={{ color: '#38bdf8' }}>main</code> -- a git history safety net for the static site's source, not a database backup.</li>
              <li><strong style={{ color: '#fff' }}>No MinIO replication, no RPO/RTO targets, and no Ansible-driven recovery are configured anywhere in this repo.</strong> Those would need to be built by whoever operates the enterprise-gis stack in production.</li>
            </ul>
          </section>

          {/* Integration & Data Flows */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <RefreshCw size={18} color="#8b5cf6" /> Deployment Pipelines (as actually configured)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.6 }}>
              The public site's deployment is plain static hosting via GitHub Actions -- there is no container registry, orchestrator, or database migration step in this path, since the live site reads bundled JSON rather than the enterprise-gis database.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
              <ol style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong style={{ color: '#fff' }}>Deploy NBMS to Pages:</strong> on every push to <code style={{ color: '#ec4899' }}>main</code>, builds the app with Vite and publishes <code style={{ color: '#ec4899' }}>dist/</code> to the <code style={{ color: '#ec4899' }}>gh-pages</code> branch.</li>
                <li><strong style={{ color: '#fff' }}>Backup on Deploy:</strong> snapshots the repo to a timestamped backup branch on the same trigger (see above).</li>
                <li><strong style={{ color: '#fff' }}>Daily Site Audit:</strong> a scheduled Playwright run that checks the live site and commits its findings under <code style={{ color: '#ec4899' }}>audit-log/</code>.</li>
                <li><strong style={{ color: '#fff' }}>Uptime Check / Uptime Monitor:</strong> scheduled every 30 minutes; opens a GitHub issue if the live site stops returning HTTP 200.</li>
              </ol>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
