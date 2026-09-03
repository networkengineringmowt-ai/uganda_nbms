import { useState } from 'react';
import { Database, History, Clock, Search, ArrowLeftRight } from 'lucide-react';
import { downloadCSV } from '../../utils/exportUtils';

// This app has no live database change-log backend to read from (see
// bmsDataService.js -- writes go to a local-drive server, not a
// transaction-logged database). Previously this page displayed a
// hardcoded set of invented log rows and connection/transaction counts
// as if they were real activity; that fabricated data has been removed
// rather than left to mislead anyone reviewing it as an actual security
// or integrity record. The table stays empty until a real audited
// backend is wired in.
const AUDIT_LOGS = [];

export default function AuditTools() {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredLogs = AUDIT_LOGS.filter(l => l.user.includes(searchTerm) || l.action.includes(searchTerm));

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', width: '220px', maxWidth: '100%' }}
            />
          </div>
          <button
            className="modern-btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => downloadCSV('audit_log.csv', filteredLogs)}
          >
            <ArrowLeftRight size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid #f59e0b', fontSize: '13px', color: 'var(--text-secondary)' }}>
        No live database audit backend is connected yet, so there is no transaction/connection activity to report here. This tool will populate once the app is wired to an audited database backend.
      </div>

      <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <History size={16} color="#94a3b8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Transaction Logs</span>
        </div>
        <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '12px' }}>
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
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit log entries available.</td>
                </tr>
              )}
              {filteredLogs.map((log) => (
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
