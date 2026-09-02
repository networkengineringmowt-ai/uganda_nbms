import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Download, ChevronDown, Printer, Check } from 'lucide-react';
import { exportStructuresCSV, printCurrentPage } from '../../utils/exportUtils';

// Utility cluster -- Back / Scroll-to-top / Export -- pinned to the
// top-right corner of every page/tab. Shared by every shell (Admin, Super,
// Mobile) and by the Dashboard's own filter bar, so a change here is a
// change everywhere. Two render modes, picked by props:
//
//  - default: `position: fixed`, top offset auto-measured live from
//    whatever is stacked above the content (the horizontal nav bar, its
//    contextual subnav when a section has multiple tabs). Measuring
//    instead of hardcoding means subnav presence/height can vary per
//    section without ever causing overlap or a gap. Re-measures on resize
//    and on tab change (`layoutKey`). It does NOT try to dodge arbitrary
//    per-page heading content further down a tab's own markup -- pages with
//    something in that top-right corner reserve their own clearance (see
//    .twin-heading in operational.css for an example).
//  - `inline`: renders just the bar itself, no fixed positioning, for
//    embedding inside another element that is already pinned top-right
//    (the Dashboard/overview tab's sticky filter bar corner cluster).
export default function PageUtilityBar({
  onBack, canGoBack, scrollTargetRef, bridges = [], culverts = [], inline = false, layoutKey,
}) {
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exported, setExported] = useState(false);
  const [autoTop, setAutoTop] = useState(84);
  const menuRef = useRef(null);
  const exportTimerRef = useRef(null);

  useEffect(() => {
    const el = scrollTargetRef?.current;
    if (!el) return undefined;
    const onScroll = () => setShowTop(el.scrollTop > 240);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollTargetRef]);

  useEffect(() => {
    if (inline) return undefined;

    // .horiz-nav-wrapper covers the Admin/Super desktop shells (nav + its
    // contextual subnav); .bms-mobile-header covers the simpler mobile shell.
    const findHeader = () => document.querySelector('.horiz-nav-wrapper') || document.querySelector('.bms-mobile-header');

    const measure = () => {
      const headerEl = findHeader();
      const bottom = headerEl ? headerEl.getBoundingClientRect().bottom : 68;
      setAutoTop(Math.round(bottom + 12));
    };

    measure();
    const ro = new ResizeObserver(measure);
    const navEl = findHeader();
    if (navEl) ro.observe(navEl);
    window.addEventListener('resize', measure);
    // Subnav mounting/unmounting on tab switch doesn't itself fire a resize
    // event, so re-measure shortly after too.
    const settleTimer = setTimeout(measure, 60);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      clearTimeout(settleTimer);
    };
  }, [inline, layoutKey]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeIfOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeIfOutside);
    return () => document.removeEventListener('mousedown', closeIfOutside);
  }, [menuOpen]);

  useEffect(() => () => { if (exportTimerRef.current) clearTimeout(exportTimerRef.current); }, []);

  const scrollToTop = () => {
    const el = scrollTargetRef?.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const flashExported = () => {
    setExported(true);
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    exportTimerRef.current = setTimeout(() => setExported(false), 1600);
  };

  const handleExportCSV = () => {
    setMenuOpen(false);
    const ok = exportStructuresCSV(bridges, culverts);
    if (ok) flashExported();
    else printCurrentPage();
  };

  const handlePrint = () => {
    setMenuOpen(false);
    printCurrentPage();
  };

  const bar = (
    <div className="putil-bar" style={inline ? undefined : { position: 'fixed', top: autoTop, right: 20 }}>
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        title="Back"
        aria-label="Back"
        className={`putil-btn${canGoBack ? '' : ' is-disabled'}`}
      >
        <ArrowLeft size={16} />
        <span className="putil-label">Back</span>
      </button>

      <button
        type="button"
        onClick={scrollToTop}
        disabled={!showTop}
        title="Scroll to top"
        aria-label="Scroll to top"
        className={`putil-btn${showTop ? '' : ' is-disabled'}`}
      >
        <ArrowUp size={16} />
        <span className="putil-label">Top</span>
      </button>

      <div className="putil-export-wrap" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          title="Export"
          aria-label="Export"
          aria-expanded={menuOpen}
          className={`putil-export-btn${exported ? ' is-success' : ''}`}
        >
          {exported ? <Check size={14} /> : <Download size={14} />}
          <span>{exported ? 'Exported' : 'Export'}</span>
          <ChevronDown size={13} className="putil-chevron" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        {menuOpen && (
          <div className="putil-menu">
            <button type="button" onClick={handleExportCSV} className="putil-menu-item">
              <Download size={13} /> Export structures (CSV)
            </button>
            <button type="button" onClick={handlePrint} className="putil-menu-item">
              <Printer size={13} /> Print / Save as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{PAGE_UTILITY_BAR_CSS}</style>
      {bar}
    </>
  );
}

const PAGE_UTILITY_BAR_CSS = `
@keyframes putilSlideIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes putilMenuIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes putilPop {
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.putil-bar {
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: 0 10px 30px rgba(0,0,0,0.45);
  pointer-events: auto;
  animation: putilSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  transition: box-shadow 0.2s ease, top 0.2s ease;
}
.putil-bar:hover {
  box-shadow: 0 14px 38px rgba(0,0,0,0.55);
}
.putil-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 9px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  color: #cbd5e1;
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease, color 0.15s ease, border-color 0.15s ease;
  overflow: hidden;
}
.putil-btn .putil-label {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 600;
  transition: max-width 0.22s ease, opacity 0.18s ease;
}
.putil-btn:not(.is-disabled):hover {
  background: rgba(96, 165, 250, 0.16);
  border-color: rgba(96, 165, 250, 0.35);
  color: #e8f7ff;
  transform: translateY(-1px);
}
.putil-btn:not(.is-disabled):hover .putil-label {
  max-width: 60px;
  opacity: 1;
}
.putil-btn:not(.is-disabled):active {
  transform: translateY(0) scale(0.94);
}
.putil-btn:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}
.putil-btn.is-disabled {
  color: #475569;
  cursor: not-allowed;
  opacity: 0.5;
}
.putil-export-wrap {
  position: relative;
}
.putil-export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 11px;
  border-radius: 8px;
  background: linear-gradient(135deg, #059669, #047857);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: filter 0.15s ease, transform 0.12s ease, background 0.2s ease;
}
.putil-export-btn:hover {
  filter: brightness(1.12);
  transform: translateY(-1px);
}
.putil-export-btn:active {
  transform: translateY(0) scale(0.95);
}
.putil-export-btn:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}
.putil-export-btn.is-success {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  animation: putilPop 0.35s ease;
}
.putil-chevron {
  transition: transform 0.18s ease;
}
.putil-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 210px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  overflow: hidden;
  animation: putilMenuIn 0.16s ease;
}
.putil-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 12.5px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
}
.putil-menu-item:hover {
  background: rgba(96, 165, 250, 0.14);
}
@media (max-width: 760px) {
  .putil-bar { right: 12px; }
  .putil-btn .putil-label { display: none; }
}
`;
