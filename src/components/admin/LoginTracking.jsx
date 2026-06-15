import { useState } from 'react';
import { History, LogIn, UserX } from 'lucide-react';

const MOCK_LOGINS = [
  { id: 1, user: 'admin.super', time: '2 mins ago', ip: '192.168.1.45', status: 'SUCCESS', location: 'Kampala, UG' },
  { id: 2, user: 'inspector.mbale', time: '14 mins ago', ip: '10.0.0.12', status: 'SUCCESS', location: 'Mbale, UG' },
  { id: 3, user: 'unknown', time: '1 hour ago', ip: '144.12.33.2', status: 'FAILED_ATTEMPT', location: 'London, UK' },
  { id: 4, user: 'admin.super', time: '3 hours ago', ip: '192.168.1.45', status: 'SUCCESS', location: 'Kampala, UG' },
  { id: 5, user: 'data.clerk', time: '5 hours ago', ip: '192.168.1.112', status: 'SUCCESS', location: 'Kampala, UG' },
];

export default function LoginTracking() {
  const [logs] = useState(MOCK_LOGINS);

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
