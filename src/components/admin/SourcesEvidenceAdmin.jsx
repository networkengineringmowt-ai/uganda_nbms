import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Camera,
  CheckCircle2,
  Database,
  FileText,
  FolderArchive,
  Image,
  Search,
  ShieldCheck,
} from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const dataUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;

const GENERATED_DOCS = [
  {
    title: 'Enterprise GIS Architecture',
    path: 'docs/ENTERPRISE_GIS_ARCHITECTURE.md',
    audience: 'GIS architects, database administrators and operations teams',
    status: 'Published',
    summary: 'Complete open-source enterprise GIS layers, services, security zones, database plan, management paths, backups and scaling.',
  },
  {
    title: 'Photogrammetry and Reality Twin',
    path: 'docs/PHOTOGRAMMETRY_REALITY_TWIN.md',
    audience: 'Bridge engineers, surveyors and reality-capture teams',
    status: 'Published',
    summary: 'Full-photo reconstruction workflow, point-cloud contract, structural overlays, dimension ticks, survey controls and quality gates.',
  },
  {
    title: 'Photo Evidence and Digital Twin Guide',
    path: 'docs/PHOTO_EVIDENCE_AND_DIGITAL_TWIN.md',
    audience: 'Inspectors, bridge engineers and data stewards',
    status: 'Published',
    summary: 'Photo naming rules, source precedence, structure placement, duplicate handling, timelines, digital twins and release verification.',
  },
  {
    title: 'User Guide',
    path: 'docs/USER_GUIDE.md',
    audience: 'Engineers, planners and operators',
    status: 'Published',
    summary: 'Role access, dashboard workflows, GIS review, inventory, maintenance, reports, photos and administration.',
  },
  {
    title: 'Technical Architecture',
    path: 'docs/TECHNICAL_ARCHITECTURE.md',
    audience: 'Developers and system administrators',
    status: 'Published',
    summary: 'Frontend composition, data access, write behavior, map layers, evidence photos, security and deployment architecture.',
  },
  {
    title: 'Data and Engineering Methods',
    path: 'docs/DATA_AND_ENGINEERING.md',
    audience: 'Bridge engineers and data stewards',
    status: 'Published',
    summary: 'Asset contracts, generated datasets, condition logic, traffic estimates, location validation and quality controls.',
  },
  {
    title: 'Operations and Deployment Runbook',
    path: 'docs/OPERATIONS_AND_DEPLOYMENT.md',
    audience: 'BMS administrators and release managers',
    status: 'Published',
    summary: 'Environment setup, Supabase, builds, GitHub Pages deployment, verification, rollback and troubleshooting.',
  },
];

const DATASETS = [
  ['bridges.json', 'Bridge asset register', '546 bridge records'],
  ['culverts.json', 'Major culvert register', '452 culvert records'],
  ['road_network.json', 'National-road link register', '1,023 road links'],
  ['critical_structures.json', 'Priority engineering queue', '69 critical structures'],
  ['analytics.json', 'Generated condition and regional analytics', 'Dashboard aggregates'],
  ['historical_traffic.json', 'Historical and projected traffic evidence', 'Traffic time series'],
  ['documents.json', 'Indexed source-document corpus', 'Searchable extracted text'],
  ['gallery/index.json', 'Evidence-photo index', 'Structure-linked media'],
];

const documentCategory = (document) => {
  const value = `${document.filename} ${document.snippet || ''}`.toLowerCase();
  if (value.includes('manual') || value.includes('guide') || value.includes('strategy')) return 'Manual / Guidance';
  if (value.includes('inspection') || value.includes('condition')) return 'Inspection / Condition';
  if (value.includes('traffic') || value.includes('statistics')) return 'Traffic / Analytics';
  if (value.includes('investment') || value.includes('project') || value.includes('critical')) return 'Planning / Investment';
  return 'Technical Reference';
};

export default function SourcesEvidenceAdmin() {
  const [activeView, setActiveView] = useState('documentation');
  const [documents, setDocuments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [photoAudit, setPhotoAudit] = useState({});
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      fetch(dataUrl('data/documents.json')).then((response) => response.json()),
      fetch(dataUrl('gallery/index.json')).then((response) => response.json()),
      fetch(dataUrl('gallery/audit.json')).then((response) => response.json()),
    ]).then(([documentRows, photoRows, audit]) => {
      setDocuments(documentRows);
      setPhotos(photoRows);
      setPhotoAudit(audit);
    }).catch(console.error);
  }, []);

  const documentTypes = useMemo(() => ['All', ...new Set(documents.map((document) => document.type))], [documents]);
  const filteredDocuments = useMemo(() => {
    const term = query.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesType = typeFilter === 'All' || document.type === typeFilter;
      const matchesTerm = !term || `${document.filename} ${document.snippet || ''}`.toLowerCase().includes(term);
      return matchesType && matchesTerm;
    });
  }, [documents, query, typeFilter]);
  const metrics = useMemo(() => ({
    documentSize: documents.reduce((sum, document) => sum + Number(document.size_mb || 0), 0),
    photoStructures: new Set(photos.map((photo) => photo.structure_id).filter(Boolean)).size,
    bridgePhotos: photos.filter((photo) => String(photo.structure_id || '').startsWith('B')).length,
    culvertPhotos: photos.filter((photo) => String(photo.structure_id || '').startsWith('C')).length,
    sourceConfirmed: photos.filter((photo) => String(photo.match_method || '').includes('source-folder')).length,
    aliases: photos.filter((photo) => photo.duplicate_of).length,
  }), [documents, photos]);

  return (
    <div className="sources-evidence">
      <header className="sources-hero">
        <div>
          <span className="panel-kicker">Admin knowledge registry</span>
          <h1>Sources &amp; Evidence</h1>
          <p>Trace generated guidance, source documents, datasets and inspection evidence used by the Uganda BMS.</p>
        </div>
        <div className="sources-assurance">
          <ShieldCheck size={20} />
          <span><strong>Evidence index active</strong><small>Source lineage is visible to administrators</small></span>
        </div>
      </header>

      <section className="sources-kpis">
        <article><BookOpen size={19} /><span>Generated documentation</span><strong>{GENERATED_DOCS.length}</strong><small>Published admin guides</small></article>
        <article><FileText size={19} /><span>Source documents</span><strong>{documents.length}</strong><small>{metrics.documentSize.toFixed(1)} MB indexed</small></article>
        <article><Camera size={19} /><span>Publishable evidence</span><strong>{photos.length.toLocaleString()}</strong><small>{photoAudit.source_repository_images?.toLocaleString() || '-'} source-repository photos audited</small></article>
        <article><Database size={19} /><span>Published datasets</span><strong>{DATASETS.length}</strong><small>Operational data products</small></article>
      </section>

      <nav className="sources-tabs" aria-label="Sources and evidence views">
        <button className={activeView === 'documentation' ? 'active' : ''} onClick={() => setActiveView('documentation')}><BookOpen size={16} /> Documentation</button>
        <button className={activeView === 'sources' ? 'active' : ''} onClick={() => setActiveView('sources')}><FolderArchive size={16} /> Source Register</button>
        <button className={activeView === 'evidence' ? 'active' : ''} onClick={() => setActiveView('evidence')}><Camera size={16} /> Evidence Coverage</button>
      </nav>

      {activeView === 'documentation' && (
        <section className="documentation-workspace">
          <div className="sources-section-heading">
            <div><span className="panel-kicker">Generated system documentation</span><h2>Administration library</h2></div>
            <span className="sources-status"><CheckCircle2 size={14} /> Reviewed for current build</span>
          </div>
          <div className="documentation-grid">
            {GENERATED_DOCS.map((document) => (
              <article className="documentation-card" key={document.path}>
                <div className="documentation-icon"><BookOpen size={21} /></div>
                <span className="documentation-status">{document.status}</span>
                <h3>{document.title}</h3>
                <p>{document.summary}</p>
                <dl>
                  <div><dt>Audience</dt><dd>{document.audience}</dd></div>
                  <div><dt>Repository path</dt><dd>{document.path}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeView === 'sources' && (
        <section className="source-register">
          <div className="sources-toolbar">
            <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename or extracted source text" /></label>
            <div>{documentTypes.map((type) => <button key={type} className={typeFilter === type ? 'active' : ''} onClick={() => setTypeFilter(type)}>{type}</button>)}</div>
            <span>{filteredDocuments.length} records</span>
          </div>
          <div className="source-table-wrap">
            <table className="source-table">
              <thead><tr><th>Document</th><th>Category</th><th>Type</th><th>Size</th><th>Extracted evidence</th></tr></thead>
              <tbody>
                {filteredDocuments.map((document, index) => (
                  <tr key={`${document.filename}-${index}`}>
                    <td><FileText size={15} /><strong>{document.filename}</strong></td>
                    <td>{documentCategory(document)}</td>
                    <td><span className="source-type">{document.type}</span></td>
                    <td>{document.size_mb} MB</td>
                    <td>{document.snippet || 'No extracted text available.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeView === 'evidence' && (
        <section className="evidence-coverage">
          <div className="evidence-summary-grid">
            <article><Image size={20} /><span>Bridge evidence</span><strong>{metrics.bridgePhotos.toLocaleString()}</strong><small>Indexed bridge photographs</small></article>
            <article><Image size={20} /><span>Culvert evidence</span><strong>{metrics.culvertPhotos.toLocaleString()}</strong><small>Indexed major-culvert photographs</small></article>
            <article><CheckCircle2 size={20} /><span>Structures covered</span><strong>{metrics.photoStructures}</strong><small>Assets with linked evidence</small></article>
            <article><FolderArchive size={20} /><span>Source-folder confirmed</span><strong>{metrics.sourceConfirmed.toLocaleString()}</strong><small>{metrics.aliases.toLocaleString()} duplicate aliases retained for lineage</small></article>
          </div>
          <div className="dataset-register">
            <div className="sources-section-heading"><div><span className="panel-kicker">Published data lineage</span><h2>Operational data products</h2></div></div>
            {DATASETS.map(([file, purpose, coverage]) => (
              <article key={file}>
                <Database size={17} />
                <span><strong>{file}</strong><small>{purpose}</small></span>
                <em>{coverage}</em>
                <CheckCircle2 size={16} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
