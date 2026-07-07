import { useState } from 'react';
import BmsSidebar from './BmsSidebar';
import MapDashboard from '../MapDashboard';

// Placeholders for new views
import BridgeMemberInfo from '../BridgeMemberInfo';
import InspectionPlanManager from '../InspectionPlanManager';
import BmsReports from '../BmsReports';
import UserManagement from '../admin/UserManagement';

export default function BmsClassicShell({ bridges, culverts, role }) {
  const [activeMenu, setActiveMenu] = useState('home');
  const [selectedBridge, setSelectedBridge] = useState(null);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f1f5f9', overflow: 'hidden' }}>
      <BmsSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} role={role} />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top Header */}
        <header style={{ 
          height: '60px', 
          background: '#fff', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>
            {activeMenu.replace('_', ' ')}
          </h2>
        </header>

        {/* Dynamic Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: activeMenu === 'home' ? '0' : '24px' }}>
          {activeMenu === 'home' && (
            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
               <MapDashboard selectedBridge={selectedBridge} onSelectBridge={setSelectedBridge} />
               <div style={{ position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(255,255,255,0.9)', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                 <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1e293b' }}>Condition Grade</h4>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}><div style={{width:'12px',height:'12px',background:'#3b82f6',borderRadius:'2px'}}></div> A = Excellent</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}><div style={{width:'12px',height:'12px',background:'#10b981',borderRadius:'2px'}}></div> B = Good</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}><div style={{width:'12px',height:'12px',background:'#f59e0b',borderRadius:'2px'}}></div> C = Fair</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}><div style={{width:'12px',height:'12px',background:'#f97316',borderRadius:'2px'}}></div> D = Poor</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}><div style={{width:'12px',height:'12px',background:'#ef4444',borderRadius:'2px'}}></div> E = Critical</div>
               </div>
            </div>
          )}
          {activeMenu === 'basic_info' && <BridgeMemberInfo bridges={bridges} />}
          {activeMenu === 'inspection_plan' && <InspectionPlanManager bridges={bridges} />}
          {activeMenu === 'maintenance' && <BmsReports bridges={bridges} culverts={culverts} mode="maintenance" />}
          {activeMenu === 'users' && <UserManagement />}
          {activeMenu === 'config' && (
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b' }}>System Configuration</h3>
              <p style={{ color: '#64748b' }}>Configure application-wide settings and parameters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
