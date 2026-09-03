import { useState } from 'react';
import { History, LogIn, UserX } from 'lucide-react';

// No live authentication backend feeds this page (see the standing
// safety note on this engagement: the production login gate is a
// separate "Secure Gateway" this app doesn't have log access to).
// Previously this page displayed invented usernames, IP addresses, and
// geolocations as if they were real login history -- fabricated
// security data is worse than none, so the table is left genuinely
// empty until a real access-log backend is connected.
const LOGIN_RECORDS = [];

export default function LoginTracking() {
  const [logs] = useState(LOGIN_RECORDS);

  return (
    <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '8px', color: '#38bdf8' }}>
          <History size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>Login Tracking & Access Logs</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Monitor authentication attempts, geographical access points, and security alerts.</p>
        </div>
      </div>

      <div className="table-responsive" style={{ flex: 1, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User Account</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>No login activity available.</td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.time}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.user}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ip}</td>
                <td>{log.location}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444'
                  }}>
                    {log.status === 'SUCCESS' ? <LogIn size={12} style={{marginRight: 4, verticalAlign: 'text-bottom'}} /> : <UserX size={12} style={{marginRight: 4, verticalAlign: 'text-bottom'}} />}
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
