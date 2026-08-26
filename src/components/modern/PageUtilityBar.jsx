import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Download, ChevronDown, Printer } from 'lucide-react';
import { exportStructuresCSV, printCurrentPage } from '../../utils/exportUtils';

// Small floating utility bar (Back / Scroll-to-top / Export) mounted once per
// shell so it appears consistently on every page without altering any of the
// existing page layouts. Every control is fully functional:
//  - Back pops the shell's real tab-navigation history (see useTabHistory).
//  - Up smooth-scrolls the active page's scroll container back to the top,
//    and only lights up once the user has actually scrolled down.
//  - Export offers a real CSV download of the current structures dataset,
//    plus a print/save-as-PDF fallback for pages without tabular data.
export default function PageUtilityBar({
  onBack,
  canGoBack,
  scrollTargetRef,
  bridges = [],
  culverts = [],
  bottomOffset = 16,
}) {
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const el = scrollTargetRef?.current;
    if (!el) return undefined;
    const onScroll = () => setShowTop(el.scrollTop > 240);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollTargetRef]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeIfOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeIfOutside);
    return () => document.removeEventListener('mousedown', closeIfOutside);
  }, [menuOpen]);

  const scrollToTop = () => {
    const el = scrollTargetRef?.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCSV = () => {
    setMenuOpen(false);
    const ok = exportStructuresCSV(bridges, culverts);
    if (!ok) printCurrentPage();
  };

  const handlePrint = () => {
    setMenuOpen(false);
    printCurrentPage();
  };

  const iconBtnStyle = (enabled) => ({
    width: 34,
    height: 34,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.85)',
    color: enabled ? '#cbd5e1' : '#475569',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.5,
    backdropFilter: 'blur(8px)',
    transition: 'all 0.15s ease',
  });

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: bottomOffset,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: 6,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}
    >
      <button onClick={onBack} disabled={!canGoBack} title="Back" style={iconBtnStyle(canGoBack)}>
        <ArrowLeft size={16} />
      </button>
      <button onClick={scrollToTop} disabled={!showTop} title="Scroll to top" style={iconBtnStyle(showTop)}>
        <ArrowUp size={16} />
      </button>

      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title="Export"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '0 10px',
            height: 34,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Download size={14} /> Export
          <ChevronDown size={13} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 0,
              minWidth: 210,
              background: 'rgba(15, 23, 42, 0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <button onClick={handleExportCSV} style={menuItemStyle}>
              <Download size={13} /> Export structures (CSV)
            </button>
            <button onClick={handlePrint} style={menuItemStyle}>
              <Printer size={13} /> Print / Save as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  color: '#e2e8f0',
  fontSize: 12.5,
  cursor: 'pointer',
  textAlign: 'left',
};
