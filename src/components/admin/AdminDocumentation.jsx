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
            Comprehensive technical documentation for the Uganda Ministry of Works and Transport (MoWT) Bridge Management System (BMS). 
            This document outlines the system architecture, deployment topologies, disaster recovery protocols, identity management, and service configurations required for enterprise-grade operation.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '32px' }}>
          {/* Service Inventory */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Component size={18} color="#10b981" /> Detailed Service Inventory
            </h2>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Subsystem</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Technology</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Internal Port</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Function</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--text-secondary)' }}>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Gateway</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Nginx 1.25 (Alpine)</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>80 / 443</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Reverse proxy, SSL termination, Rate limiting (100 req/s), WAF</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Identity Provider</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Keycloak 22.0</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8080</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>OIDC flows, JWT issuing, SAML 2.0 federation with Gov portals</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Relational Data</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>PostgreSQL 15 / PostGIS 3.3</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>5432</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ACID transactions, Spatial indexing (GIST), JSONB condition data</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>OGC Publisher</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>GeoServer 2.23</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8080</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>WMS/WFS/WMTS for QGIS and Web, SLD styling, Vector Tiles (.pbf)</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Object Storage</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>MinIO RELEASE.2023</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>9000</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>S3-compatible bucket for inspection photos, point clouds (.las), models</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Backend API</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Node.js / Express</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>3000</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>REST endpoints, BMS logic, deficiency calculations, JWT validation</td></tr>
                  <tr><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Tile Cache</td><td style={{ padding: '10px 16px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>MapProxy</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>8081</td><td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>WMTS caching, accelerates GeoServer map rendering for high load</td></tr>
                  <tr><td style={{ padding: '10px 16px' }}>Telemetry</td><td style={{ padding: '10px 16px', color: '#38bdf8' }}>Prometheus + Grafana</td><td style={{ padding: '10px 16px' }}>9090 / 3000</td><td style={{ padding: '10px 16px' }}>Scrapes /metrics, alerting rules (CPU &gt; 80%), visual dashboards</td></tr>
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

CORE_STRUCTURE (bms_id, type, geom, built_year) 
  ||--o{ INSPECTION_LOG (ins_id, bms_id, inspector_id, date, overall_rating, deficiency_idx)
  ||--o{ COMPONENT_RATING (comp_id, ins_id, element_type, condition_score_0_9)
  ||--o{ EVIDENCE_MEDIA (media_id, bms_id, minio_key, media_type, verified)
  ||--o{ MAINTENANCE_ORDER (order_id, bms_id, planned_date, cost_estimate, status)

Schemas & Ownership:
- core_gis: Read-heavy, spatially indexed. Master inventory of bridges and culverts.
- inspection: Append-only ledger of physical condition assessments.
- maintenance: Mutational state for work orders and interventions.
- audit: Trigger-based temporal tables. Records every INSERT/UPDATE/DELETE.
- ml_inference: Output schemas for predictive deterioration modeling.`}</pre>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>
              All spatial columns use SRID 4326 (WGS84) natively and are reprojected on-the-fly by GeoServer or PostGIS <code style={{ color: '#ec4899' }}>ST_Transform</code> when local UTM projections are required.
            </p>
          </section>

          {/* Network and Trust Zones */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={18} color="#f59e0b" /> Network & Security Policies
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>DMZ / Edge Network (Tier 1):</strong> Nginx container exposed on <code style={{ color: '#fff' }}>0.0.0.0:443</code>. All other containers do NOT map ports to the host. Nginx terminates TLS using Let's Encrypt certificates or internal PKI.
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '3px solid #38bdf8', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Application Network (Tier 2):</strong> Internal Docker bridge network. Node.js API, GeoServer, and Keycloak communicate securely via internal DNS (e.g., <code style={{ color: '#fff' }}>http://api:3000</code>).
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Data Network (Tier 3):</strong> Isolated internal network for PostgreSQL and MinIO. Only accessible by the Application Network. Strict `pg_hba.conf` denying any external IPs.
              </div>
            </div>
          </section>

          {/* Identity & Access Management */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Key size={18} color="#ec4899" /> Identity & Access Management (RBAC)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
              The system utilizes Keycloak for centralized authentication. All API endpoints and GeoServer secured layers require a valid Bearer token (JWT).
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
                <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><strong>Super User / Engineer</strong></td><td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Approve inspections, trigger deterioration models, modify structural inventory.</td></tr>
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
              <li><strong style={{ color: '#fff' }}>PostgreSQL WAL Archiving:</strong> Continuous WAL archiving via <code style={{ color: '#38bdf8' }}>pgBackRest</code> to remote S3 bucket, achieving a Recovery Point Objective (RPO) of 5 minutes.</li>
              <li><strong style={{ color: '#fff' }}>Nightly Logical Dumps:</strong> Automated <code style={{ color: '#38bdf8' }}>pg_dump</code> runs at 02:00 EAT, compressed and encrypted before remote storage.</li>
              <li><strong style={{ color: '#fff' }}>MinIO Bucket Replication:</strong> Asynchronous active-passive replication to an off-site MinIO cluster for all evidence media.</li>
              <li><strong style={{ color: '#fff' }}>Infrastructure as Code (IaC):</strong> Entire environment can be restored in under 15 minutes (RTO) using Ansible playbooks and Docker Compose scripts.</li>
            </ul>
          </section>

          {/* Integration & Data Flows */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <RefreshCw size={18} color="#8b5cf6" /> Deployment & CI/CD Pipelines
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.6 }}>
              The application utilizes a GitOps methodology. Production updates are triggered automatically via CI/CD (GitHub Actions / GitLab CI).
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
              <ol style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Developers push code to the <code style={{ color: '#ec4899' }}>main</code> branch.</li>
                <li>CI Runner executes Unit Tests (Jest) and integration tests against a headless PostGIS instance.</li>
                <li>Docker images are built, tagged with the commit SHA, and pushed to the private container registry.</li>
                <li>Webhook notifies the production server, which pulls the new images and performs a zero-downtime rolling update via Docker Swarm.</li>
                <li>Flyway executes any pending SQL migrations automatically on startup.</li>
              </ol>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
