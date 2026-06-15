import {
  Home, Database, Calendar, Users, Settings, LogOut, Wrench
} from 'lucide-react';

export default function BmsSidebar({ activeMenu, setActiveMenu, role }) {
  const isAdmin = role === 'admin';

  return (
    <aside className="bms-sidebar" style={{
      width: '260px',
      height: '100vh',
      background: '#1e293b',
      color: '#cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      <div className="sidebar-header" style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <img src="mowt.jpg" alt="MoWT Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff', padding: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: '15px', color: '#f8fafc', letterSpacing: '0.5px' }}>BMS</strong>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Management Client</span>
        </div>
      </div>

      <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SidebarItem icon={<Home size={18} />} label="Home" active={activeMenu === 'home'} onClick={() => setActiveMenu('home')} />
          
          <div className="sidebar-label" style={{ padding: '16px 20px 8px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Core</div>
          <SidebarItem icon={<Database size={18} />} label="Basic Information" active={activeMenu === 'basic_info'} onClick={() => setActiveMenu('basic_info')} />
          <SidebarItem icon={<Calendar size={18} />} label="Inspection Plan" active={activeMenu === 'inspection_plan'} onClick={() => setActiveMenu('inspection_plan')} />
          <SidebarItem icon={<Wrench size={18} />} label="Maintenance Information" active={activeMenu === 'maintenance'} onClick={() => setActiveMenu('maintenance')} />
          
          {isAdmin && (
            <>
              <div className="sidebar-label" style={{ padding: '16px 20px 8px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>System</div>
              <SidebarItem icon={<Users size={18} />} label="User Management" active={activeMenu === 'users'} onClick={() => setActiveMenu('users')} />
              <SidebarItem icon={<Settings size={18} />} label="Config" active={activeMenu === 'config'} onClick={() => setActiveMenu('config')} />
            </>
          )}
        </nav>
      </div>

      <div className="sidebar-footer" style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <SidebarItem icon={<LogOut size={18} />} label="Exit" onClick={() => window.location.reload()} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '0 8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}></div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Server Connected</span>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      width: '100%',
      border: 'none',
      background: active ? 'linear-gradient(90deg, rgba(37,99,235,0.15) 0%, transparent 100%)' : 'transparent',
      color: active ? '#60a5fa' : '#cbd5e1',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: active ? 600 : 500,
      borderLeft: `3px solid ${active ? '#3b82f6' : 'transparent'}`,
      transition: 'all 0.2s'
    }}>
      <span style={{ color: active ? '#3b82f6' : '#64748b' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
