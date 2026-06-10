export default function ModernHeader({ modernTab, pageTitle, pageSubtitle }) {
  return (
    <header className="topbar glass-header">
      <div className="page-heading">
        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 800 }}>{pageTitle(modernTab)}</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{pageSubtitle(modernTab)}</p>
      </div>
      
      <div className="topbar-actions">
        <div className="role-badge">MoWT Inspector</div>
      </div>
    </header>
  );
}
