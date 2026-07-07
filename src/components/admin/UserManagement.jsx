import { useState } from 'react';
import { UserPlus, Search, Shield, History, Activity } from 'lucide-react';

export default function UserManagement() {
  const [users] = useState([
    { id: 'E101', name: 'John Doe', department: 'BMS', role: 'Operations Manager', status: 'Active' },
    { id: 'E102', name: 'Jane Smith', department: 'Inspection', role: 'Inspector', status: 'Active' },
    { id: 'E103', name: 'Mike Johnson', department: 'Maintenance', role: 'Bridge Manager', status: 'Pending Approval' }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
      
      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Shield size={24} /></div>
          <div><div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Users</div><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>124</div></div>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Activity size={24} /></div>
          <div><div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Approvals</div><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>8</div></div>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}><History size={24} /></div>
          <div><div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>System Events (24h)</div><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>1,432</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        {/* User Table */}
        <div className="glass-card" style={{ flex: 2, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(3, 9, 24, 0.52)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>User Permission Management</span>
            <button style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <UserPlus size={14} /> Add User
            </button>
          </div>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input type="text" placeholder="Search by name or ID..." style={{ padding: '8px 12px 8px 36px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', width: '100%', background: '#071126', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ background: 'rgba(3, 9, 24, 0.72)', color: '#7dd3fc' }}>
              <tr>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Emp ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dept</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>{u.id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.department}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.role}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: u.status === 'Active' ? '#d1fae5' : '#fef3c7', color: u.status === 'Active' ? '#059669' : '#d97706' }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ padding: '4px 8px', fontSize: '11px', color: '#93c5fd', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Log Placeholder */}
        <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(3, 9, 24, 0.52)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} /> System Usage History
          </div>
          <div style={{ padding: '20px', flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>John Doe (Operations Manager)</span>
                <span>Approved user 'E102'</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>10 mins ago</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Jane Smith (Inspector)</span>
                <span>Uploaded IC Client results for 'Nile Bridge'</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>2 hours ago</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>System</span>
                <span>Updated condition descriptions for 'Karuma Falls'</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>5 hours ago</span>
              </div>
            </div>
            <button style={{ width: '100%', marginTop: '24px', padding: '8px', background: '#101f39', border: '1px solid var(--border)', borderRadius: '6px', color: '#93c5fd', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              View Full Audit Log
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
