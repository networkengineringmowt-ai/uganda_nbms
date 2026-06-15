import { 
  Database, 
  MonitorPlay, 
  Map, 
  Users, 
  Cpu, 
  ShieldCheck,
  Smartphone,
  Cloud,
  FileText,
  WifiOff,
  Activity,
  Lock,
  Globe
} from 'lucide-react';

export default function AdminArchitecture() {
  return (
    <div className="admin-view-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">System Architecture</h1>
          <p className="admin-subtitle">Full Schematic of the BMS Registry ecosystem</p>
        </div>
      </div>

      <div className="architecture-canvas animate">
        
        {/* Client Layer */}
        <div className="arch-layer client-layer fade-in-1">
          <div className="layer-label">Client Layer (Presentation & Offline)</div>
          <div className="node-group">
            <div className="arch-node">
              <MonitorPlay size={32} />
              <strong>Web Dashboard</strong>
              <span>React / Vite HQ Admin</span>
            </div>
            <div className="arch-node">
              <Smartphone size={32} />
              <strong>Mobile Inspectors</strong>
              <span>PWA / Field App</span>
            </div>
            <div className="arch-node">
              <WifiOff size={32} />
              <strong>Offline Storage</strong>
              <span>IndexedDB Sync Queue</span>
            </div>
          </div>
        </div>

        <div className="arch-connector vertical flow-1">
          <div className="data-pulse"></div>
        </div>

        {/* Security & API Layer */}
        <div className="arch-layer auth-layer fade-in-2">
          <div className="layer-label">Security & API Gateway</div>
          <div className="node-group">
            <div className="arch-node highlight">
              <ShieldCheck size={32} />
              <strong>Auth Gateway</strong>
              <span>Role-based Access</span>
            </div>
            <div className="arch-node highlight">
              <Lock size={32} />
              <strong>API Rate Limiter</strong>
              <span>DDoS Protection</span>
            </div>
            <div className="arch-node highlight">
              <Globe size={32} />
              <strong>REST / GraphQL</strong>
              <span>Data Endpoints</span>
            </div>
          </div>
        </div>

        <div className="arch-connector vertical flow-2">
          <div className="data-pulse"></div>
        </div>

        {/* Application Services Layer */}
        <div className="arch-layer service-layer fade-in-3">
          <div className="layer-label">Application Services (Business Logic)</div>
          <div className="node-group">
            <div className="arch-node">
              <Cpu size={32} />
              <strong>Analytics Engine</strong>
              <span>Condition & Priority Algos</span>
            </div>
            <div className="arch-node">
              <Map size={32} />
              <strong>GIS Processing</strong>
              <span>Spatial Queries & Mapping</span>
            </div>
            <div className="arch-node">
              <Users size={32} />
              <strong>Workflow Engine</strong>
              <span>Approvals & Maintenance</span>
            </div>
            <div className="arch-node">
              <FileText size={32} />
              <strong>Report Generator</strong>
              <span>PDF & Excel Exports</span>
            </div>
            <div className="arch-node">
              <Activity size={32} />
              <strong>Audit Logger</strong>
              <span>Action Tracking</span>
            </div>
          </div>
        </div>

        <div className="arch-connector vertical flow-3">
          <div className="data-pulse"></div>
        </div>

        {/* Data Layer */}
        <div className="arch-layer data-layer fade-in-4">
          <div className="layer-label">Data Layer (Storage & Assets)</div>
          <div className="node-group">
            <div className="arch-node database">
              <Database size={32} />
              <strong>Core Relational DB</strong>
              <span>PostgreSQL / Supabase</span>
            </div>
            <div className="arch-node database">
              <Map size={32} />
              <strong>Spatial DB</strong>
              <span>PostGIS Extensions</span>
            </div>
            <div className="arch-node database">
              <Cloud size={32} />
              <strong>Asset Storage</strong>
              <span>S3 / Blob Photos & Docs</span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .admin-view-container {
          padding: 24px 32px;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }
        .admin-header {
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .admin-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 4px;
        }
        .admin-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }
        .architecture-canvas {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
        }
        
        /* Animation Base Classes */
        .fade-in-1, .fade-in-2, .fade-in-3, .fade-in-4, .flow-1, .flow-2, .flow-3 {
          opacity: 0;
          transform: translateY(20px);
        }

        /* Staggered Animations Triggered on Mount */
        .architecture-canvas.animate .fade-in-1 {
          animation: slideUpFade 0.6s ease forwards, floatNode 6s ease-in-out infinite 0.6s;
        }
        .architecture-canvas.animate .flow-1 {
          animation: slideUpFade 0.4s ease forwards;
          animation-delay: 0.5s;
        }
        .architecture-canvas.animate .fade-in-2 {
          animation: slideUpFade 0.6s ease forwards, floatNode 5s ease-in-out infinite 0.7s;
        }
        .architecture-canvas.animate .flow-2 {
          animation: slideUpFade 0.4s ease forwards;
          animation-delay: 1.1s;
        }
        .architecture-canvas.animate .fade-in-3 {
          animation: slideUpFade 0.6s ease forwards, floatNode 7s ease-in-out infinite 1.3s;
        }
        .architecture-canvas.animate .flow-3 {
          animation: slideUpFade 0.4s ease forwards;
          animation-delay: 1.7s;
        }
        .architecture-canvas.animate .fade-in-4 {
          animation: slideUpFade 0.6s ease forwards, floatNode 6.5s ease-in-out infinite 1.9s;
        }

        @keyframes slideUpFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes floatNode {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }

        .arch-layer {
          width: 100%;
          max-width: 900px;
          padding: 32px 24px;
          border-radius: 16px;
          position: relative;
          background: #ffffff;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
          border: 1px solid var(--border);
          z-index: 2;
        }
        .client-layer { border-top: 4px solid #0ea5e9; }
        .auth-layer { border-top: 4px solid #10b981; }
        .service-layer { border-top: 4px solid #8b5cf6; }
        .data-layer { border-top: 4px solid #f59e0b; }
        
        .layer-label {
          position: absolute;
          top: -12px;
          left: 24px;
          background: #f8fafc;
          padding: 4px 14px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        
        .node-group {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        
        .arch-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 16px;
          background: #f8fafc;
          border-radius: 12px;
          min-width: 140px;
          flex: 1;
          max-width: 180px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        
        .arch-node::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0));
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .arch-node:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
          z-index: 10;
        }

        .arch-node:hover::before {
          opacity: 1;
        }
        
        .arch-node svg {
          color: #64748b;
          margin-bottom: 12px;
          transition: transform 0.3s, color 0.3s;
        }

        .arch-node:hover svg {
          transform: scale(1.1);
          color: #0ea5e9;
        }
        
        .arch-node strong {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
          z-index: 1;
        }
        
        .arch-node span {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.3;
          z-index: 1;
        }
        
        .arch-node.highlight {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .arch-node.highlight:hover svg { color: #10b981; }
        
        .arch-node.database {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .arch-node.database:hover svg { color: #f59e0b; }
        
        .arch-connector {
          width: 2px;
          height: 50px;
          background: #cbd5e1;
          position: relative;
          z-index: 1;
        }
        
        .arch-connector::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: -4px;
          width: 10px;
          height: 10px;
          border-right: 2px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
          transform: rotate(45deg);
        }

        /* Animated Data Pulse */
        .data-pulse {
          position: absolute;
          top: 0;
          left: -4px;
          width: 10px;
          height: 10px;
          background-color: #0ea5e9;
          border-radius: 50%;
          box-shadow: 0 0 15px 3px #0ea5e9;
          opacity: 0;
        }

        .architecture-canvas.animate .data-pulse {
          animation: pulseDown 1.5s infinite linear;
        }

        .architecture-canvas.animate .flow-1 .data-pulse { animation-delay: 0.2s; }
        .architecture-canvas.animate .flow-2 .data-pulse { animation-delay: 0.8s; box-shadow: 0 0 15px 3px #10b981; background-color: #10b981; }
        .architecture-canvas.animate .flow-3 .data-pulse { animation-delay: 1.4s; box-shadow: 0 0 15px 3px #8b5cf6; background-color: #8b5cf6; }

        @keyframes pulseDown {
          0% {
            top: 0;
            opacity: 0;
            transform: scale(0.8);
          }
          10% {
            opacity: 1;
            transform: scale(1.2);
          }
          90% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            top: 100%;
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
