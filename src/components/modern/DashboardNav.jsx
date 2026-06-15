import { useState } from 'react';
import {
  Activity,
  ArrowUpCircle,
  BrainCircuit,
  Box,
  Calendar,
  Camera,
  Cpu,
  Database,
  FilePlus,
  FileText,
  HardHat,
  Layers,
  LibraryBig,
  LogOut,
  MapPin,
  Network,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  History,
  AlertTriangle,
  Grid,
  Smartphone
} from 'lucide-react';

const sectionDefinitions = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Database,
    defaultTab: 'overview',
    groups: [],
  },
  {
    id: 'network',
    label: 'Inventory & Condition',
    icon: MapPin,
    defaultTab: 'map',
    groups: [
      {
        label: 'Asset Network',
        tabs: [
          { id: 'map', label: 'GIS Map', icon: MapPin, clearSelection: true },
          { id: 'inventory', label: 'Inventory', icon: Layers },
          { id: 'bms_3d', label: 'Digital Twin', icon: Box },
          { id: 'critical_structures', label: 'Critical Structures', icon: AlertTriangle },
        ],
      },
      {
        label: 'Analytics & Reports',
        tabs: [
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'reports', label: 'Reports', icon: FileText },
        ],
      },
    ],
  },
  {
    id: 'evidence',
    label: 'Evidence',
    icon: Camera,
    defaultTab: 'photos',
    groups: [
      {
        label: 'Evidence Library',
        tabs: [
          { id: 'photos', label: 'Photos', icon: Camera },
          { id: 'sources_evidence', label: 'Sources & Evidence', icon: LibraryBig, adminOnly: true },
        ],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: HardHat,
    defaultTab: 'maintenance',
    groups: [
      {
        label: 'Decision Support',
        tabs: [
          { id: 'maintenance', label: 'Maintenance', icon: HardHat },
          { id: 'works', label: 'Ongoing Works', icon: HardHat },
        ],
      },
    ],
  },
  {
    id: 'capture',
    label: 'Data Capture',
    icon: FilePlus,
    defaultTab: 'capture_bridge',
    adminOnly: true,
    groups: [
      {
        label: 'Inventory',
        tabs: [
          { id: 'capture_bridge', label: 'Bridge Data', icon: FilePlus },
          { id: 'capture_culvert', label: 'Culvert Data', icon: FilePlus },
        ],
      },
      {
        label: 'Inspections',
        tabs: [
          { id: 'inspect_bridge', label: 'Inspect Bridge', icon: Activity },
          { id: 'inspect_culvert', label: 'Inspect Culvert', icon: Activity },
        ],
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    defaultTab: 'bms_plans',
    adminOnly: true,
    groups: [
      {
        label: 'BMS Management',
        tabs: [
          { id: 'bms_plans', label: 'Plans', icon: Calendar },
          { id: 'bms_users', label: 'Users', icon: Users },
          { id: 'login_tracking', label: 'Login Tracking', icon: History },
        ],
      },
      {
        label: 'System Tools',
        tabs: [
          { id: 'upgrades', label: 'Upgrades', icon: ArrowUpCircle },
          { id: 'parameters', label: 'Config', icon: Settings },
          { id: 'architecture', label: 'Architecture', icon: Network },
          { id: 'algorithms', label: 'Algorithms', icon: Cpu },
        ],
      },
    ],
  },
];

const visibleSections = (isAdmin) => sectionDefinitions
  .filter((section) => isAdmin || !section.adminOnly)
  .map((section) => ({
    ...section,
    groups: section.groups
      .map((group) => ({
        ...group,
        tabs: group.tabs.filter((tab) => isAdmin || !tab.adminOnly),
      }))
      .filter((group) => group.tabs.length),
  }));

const APP_LAUNCHER_ITEMS = [
  { id: 'bms', name: 'BMS Core', desc: 'National Roads Registry', icon: Database, color: '#3b82f6' },
  { id: 'ai', name: 'AI Analytics', desc: 'Defect Detection Hub', icon: BrainCircuit, color: '#ec4899' },
  { id: 'twin', name: 'Digital Twin', desc: 'Reality Meshes & LiDAR', icon: Box, color: '#10b981' },
  { id: 'capture', name: 'Data Capture', desc: 'Field Collection API', icon: Smartphone, color: '#f59e0b' },
];

export default function DashboardNav({ modernTab, setModernTab, setSelectedBridge, role }) {
  const isAdmin = role === 'admin';
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);
  const sections = visibleSections(isAdmin);
  const activeSection = sections.find((section) => section.defaultTab === modernTab
    || section.groups.some((group) => group.tabs.some((tab) => tab.id === modernTab))) || sections[0];
  const ActiveSectionIcon = activeSection.icon;
  const activeTabs = activeSection.groups.flatMap((group) => group.tabs);
  const showSubnav = activeTabs.length > 1;

  const openTab = (tab) => {
    setModernTab(tab.id);
    if (tab.clearSelection) setSelectedBridge(null);
  };

  const toggleAppLauncher = () => setAppLauncherOpen(!appLauncherOpen);

  return (
    <div className="horiz-nav-wrapper">
      <nav className="horiz-nav-bar" aria-label="Main sections">
        <div className="horiz-nav-brand" title="MoWT BMS National Roads Registry">
          <img src="mowt.jpg" alt="MoWT Logo" className="horiz-nav-logo" />
          <div className="horiz-nav-brand-text">
            <strong>MoWT BMS</strong>
            <span>National Roads Registry</span>
          </div>
        </div>

        <div className="horiz-nav-links main-section-links">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`horiz-nav-link ${activeSection.id === section.id ? 'active' : ''}`}
                onClick={() => openTab({ id: section.defaultTab, clearSelection: section.defaultTab === 'map' })}
              >
                <Icon size={16} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        <div className="horiz-nav-right" style={{ position: 'relative' }}>
          <button 
            className={`horiz-nav-link ${appLauncherOpen ? 'active' : ''}`} 
            title="MoWT Enterprise Applications" 
            style={{ padding: '8px', marginRight: '16px', background: appLauncherOpen ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px' }} 
            onClick={toggleAppLauncher}
          >
            <Grid size={18} />
          </button>
          
          {appLauncherOpen && (
            <div className="app-launcher-dropdown" style={{
              position: 'absolute', top: '100%', right: '160px', marginTop: '12px',
              width: '320px', background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px', zIndex: 100,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'
            }}>
              <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>Enterprise Applications</h4>
              </div>
              {APP_LAUNCHER_ITEMS.map(app => {
                const AppIcon = app.icon;
                return (
                  <div key={app.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }} className="app-launcher-item">
                    <div style={{ background: `${app.color}20`, color: app.color, padding: '12px', borderRadius: '12px', marginBottom: '8px' }}>
                      <AppIcon size={24} />
                    </div>
                    <strong style={{ fontSize: '12px', color: '#fff', marginBottom: '2px' }}>{app.name}</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{app.desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="horiz-auth-badge" title={isAdmin ? 'Full Access' : 'Dashboard Access'}>
            {isAdmin ? <ShieldCheck size={16} color="#34d399" /> : <User size={16} color="#60a5fa" />}
            <span>{isAdmin ? 'Admin' : 'Dashboard User'}</span>
          </div>
          <button className="horiz-logout" onClick={() => window.location.reload()} title="Logout"><LogOut size={14} /><span>Logout</span></button>
        </div>
      </nav>

      {showSubnav && (
        <nav className="context-subnav" aria-label={`${activeSection.label} tabs`}>
          <div className="context-subnav-title">
            <ActiveSectionIcon size={15} />
            <span>{activeSection.label}</span>
          </div>
          <div className="context-subnav-scroll">
            {activeSection.groups.map((group, groupIndex) => (
              <div className="context-subnav-group" key={group.label}>
                {groupIndex > 0 && <span className="context-subnav-divider" />}
                <span className="context-subnav-label">{group.label}</span>
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`context-subnav-tab ${modernTab === tab.id ? 'active' : ''}`}
                      onClick={() => openTab(tab)}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
