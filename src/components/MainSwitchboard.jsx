
export default function MainSwitchboard({ onOpenWindow }) {
  const menuItems = [
    { label: 'Bridge Inventory Form', action: 'bridgeInventory' },
    { label: 'Bridge Inspection Form', action: 'bridgeInspection' },
    { label: 'Culvert Inventory Form', action: 'culvertInventory' },
    { label: 'Culvert Inspection Form', action: 'culvertInspection' },
    { label: 'GIS Network Map Viewer', action: 'map' },
    { label: 'Traffic & Demand Analytics', action: 'analytics' },
    { label: 'BMS Reports & Validation', action: 'reports' },
    { label: 'Bridge Upgrades & Budgets', action: 'upgrades' },
    { label: 'Exit Application', action: 'exit' },
  ];

  return (
    <div className="ms-switchboard ms-bevel-out">
      {/* Vertical Sidebar */}
      <div className="ms-sb-sidebar">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
            boxShadow: '1px 1px 4px rgba(0,0,0,0.3)', marginBottom: '8px'
          }}>
            <strong style={{ color: '#0f172a', fontSize: '18px', fontFamily: 'Impact, sans-serif' }}>Department of National Roads, Ministry of Works and Transport</strong>
          </div>
          <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            National Roads
          </span>
        </div>
        
        <div className="ms-sb-logo-text">
          BRIDGE MANAGEMENT SYSTEM
        </div>
        
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
          v2.0 (2026)
        </span>
      </div>

      {/* Main Switchboard Options */}
      <div className="ms-sb-main">
        <div className="ms-sb-header">
          <div className="ms-sb-title">Bridge Management System</div>
          <div className="ms-sb-subtitle">Ministry of Works and Transport</div>
        </div>

        <div className="ms-sb-grid">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className="ms-sb-button-row"
              onClick={() => onOpenWindow(item.action)}
            >
              <div className="ms-sb-arrow" />
              <button className="ms-sb-button">
                {item.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
