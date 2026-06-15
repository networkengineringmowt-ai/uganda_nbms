import { useState } from 'react';
import { Database, History, Clock, Search, ArrowLeftRight } from 'lucide-react';

const MOCK_AUDIT_LOGS = [
  { id: 'AL-9921', time: '10 mins ago', user: 'system_sync', action: 'BULK_UPDATE', target: 'core.structure', status: 'SUCCESS', details: 'Synced 14 records from QField' },
  { id: 'AL-9920', time: '1 hour ago', user: 'admin_kato', action: 'UPDATE_CONDITION', target: 'inspection.inspection', status: 'SUCCESS', details: 'Changed B001 condition from Satisfactory to Fair' },
  { id: 'AL-9919', time: '2 hours ago', user: 'api_service', action: 'SCHEMA_ALTER', target: 'twin.reconstruction', status: 'DENIED', details: 'Insufficient permissions' },
  { id: 'AL-9918', time: '5 hours ago', user: 'admin_kato', action: 'DELETE_EVIDENCE', target: 'evidence.media', status: 'SUCCESS', details: 'Removed duplicate photo B001_DUP' },
  { id: 'AL-9917', time: '1 day ago', user: 'system_backup', action: 'BACKUP_DUMP', target: 'pg_dump', status: 'SUCCESS', details: 'Nightly custom-format backup' },
];

export default function AuditTools() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="#38bdf8" /> 
            Database Audit & Integrity Tools
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Immutable row-change history and PostGIS transaction monitoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search audit logs..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', width: '220px' }}
            />
          </div>
          <button className="modern-btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <ArrowLeftRight size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Active Connections</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>14</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #38bdf8' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Transactions (24h)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>1,284</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Schema Changes (7d)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>2</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Denied Queries (24h)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>7</div>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <History size={16} color="#94a3b8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transaction Logs (audit.change_log)</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>ID</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>TIME</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>USER / ROLE</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>ACTION</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>TARGET</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>DETAILS</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT_LOGS.filter(l => l.user.includes(searchTerm) || l.action.includes(searchTerm)).map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} /> {log.time}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 500 }}>{log.user}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#a78bfa' }}>{log.target}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{log.details}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '100px',
                      background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444'
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
