export default function ModernHeader({ modernTab, pageTitle, pageSubtitle, setViewMode }) {
  return (
    <header className="topbar glass-header">
      <div className="page-heading">
        <h1>{pageTitle(modernTab)}</h1>
        <p>{pageSubtitle(modernTab)}</p>
      </div>
      
      <div className="topbar-actions">
        <div className="role-badge">UNRA Inspector</div>
        <button 
          className="icon-button" 
          onClick={() => setViewMode('classic')}
          title="Switch to Access Shell"
          style={{ width: 'auto', padding: '0 12px', fontSize: '11px', fontWeight: 'bold' }}
        >
          Access Shell
        </button>
      </div>
    </header>
  );
}
