import { useState, useMemo } from 'react';
import { Save, CheckCircle, Settings, AlertTriangle, ChevronRight, Info, Scale, Activity, Gauge, ShieldCheck, Zap } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const PARAM_SECTIONS = [
  {
    id: 'deficiency',
    title: 'Deficiency Index Weights',
    icon: <Scale size={16} />,
    description: 'Controls how each major component contributes to the overall Deficiency Index (DC). Reference: BMS User Manual Table 9.',
    params: [
      { key: 'conditionWeight', label: 'Bridge Condition (DC)', desc: 'Primary structural condition deficiency', default: 0.50, min: 0, max: 1, step: 0.01 },
      { key: 'verticalClearanceWeight', label: 'Vertical Clearance (DV)', desc: 'Overhead clearance deficiency', default: 0.15, min: 0, max: 1, step: 0.01 },
      { key: 'horizontalClearanceWeight', label: 'Horizontal Clearance (DH)', desc: 'Lateral clearance deficiency', default: 0.15, min: 0, max: 1, step: 0.01 },
      { key: 'alignmentWeight', label: 'Approach Alignment (DA)', desc: 'Approach roadway alignment deficiency', default: 0.10, min: 0, max: 1, step: 0.01 },
      { key: 'trafficFactorWeight', label: 'Traffic Demand (DT)', desc: 'Traffic volume and growth factor', default: 0.10, min: 0, max: 1, step: 0.01 },
    ]
  },
  {
    id: 'component',
    title: 'Component Condition Weights',
    icon: <Activity size={16} />,
    description: 'Relative importance of each structural component in the Condition Deficiency calculation. Reference: BMS User Manual Table 9.',
    params: [
      { key: 'superstructureW', label: 'Superstructure', desc: 'Girders, deck, bearings', default: 1.00, min: 0, max: 2, step: 0.01 },
      { key: 'substructureW', label: 'Substructure', desc: 'Abutments, piers, foundations', default: 1.00, min: 0, max: 2, step: 0.01 },
      { key: 'waterwayW', label: 'Waterway / Channel', desc: 'Channel condition and scour', default: 0.83, min: 0, max: 2, step: 0.01 },
      { key: 'roadwayW', label: 'Roadway (Deck)', desc: 'Surfacing, joints, kerbs', default: 0.50, min: 0, max: 2, step: 0.01 },
      { key: 'approachW', label: 'Approaches', desc: 'Embankment and approach slabs', default: 0.25, min: 0, max: 2, step: 0.01 },
    ]
  },
  {
    id: 'constants',
    title: 'Engine Constants',
    icon: <Gauge size={16} />,
    description: 'Core constants used in the BMS ranking formulas. Reference: BMS User Manual Table 8.',
    params: [
      { key: 'ADTB', label: 'ADTB (Base ADT)', desc: 'Average Daily Traffic baseline for normalisation', default: 5400, min: 100, max: 50000, step: 100 },
      { key: 'K1', label: 'K1 (Clearance Exponent)', desc: 'Exponent for vertical clearance factor', default: 0.4, min: 0, max: 5, step: 0.1 },
      { key: 'K2', label: 'K2 (Horizontal Exponent)', desc: 'Exponent for horizontal clearance factor', default: 1.5, min: 0, max: 5, step: 0.1 },
      { key: 'K3', label: 'K3 (Alignment Exponent)', desc: 'Exponent for approach alignment factor', default: 1.5, min: 0, max: 5, step: 0.1 },
      { key: 'K4', label: 'K4 (Traffic Exponent)', desc: 'Exponent for traffic volume factor', default: 0.2, min: 0, max: 5, step: 0.01 },
    ]
  },
  {
    id: 'overrides',
    title: 'Strategic Overrides',
    icon: <ShieldCheck size={16} />,
    description: 'Policy-level overrides that modify priority rankings based on strategic importance.',
    params: [
      { key: 'strategicPenaltyReduction', label: 'Strategic Route Penalty Reduction', desc: 'Percentage penalty reduction for structures on essential supply routes', default: 10, min: 0, max: 50, step: 1, suffix: '%' },
      { key: 'minDeficiencyThreshold', label: 'Minimum Deficiency Threshold', desc: 'Structures below this threshold are excluded from priority lists', default: 5, min: 0, max: 50, step: 1, suffix: '' },
    ]
  }
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function SystemParametersForm() {
  const defaults = {};
  PARAM_SECTIONS.forEach(s => s.params.forEach(p => { defaults[p.key] = p.default; }));
  defaults.strategicImportanceFactor = true;

  const [params, setParams] = useState(defaults);
  const [savedMessage, setSavedMessage] = useState('');
  const [activeSection, setActiveSection] = useState('deficiency');
  const [editingKey, setEditingKey] = useState(null);

  const handleSave = () => {
    setSavedMessage('Configuration saved successfully.');
    setTimeout(() => setSavedMessage(''), 4000);
  };

  const handleParamChange = (key, value, pDef) => {
    const num = Number(value);
    if (isNaN(num)) return;
    const clamped = Math.min(pDef.max, Math.max(pDef.min, num));
    setParams(prev => ({ ...prev, [key]: clamped }));
  };

  // Validation for deficiency weights
  const deficiencySection = PARAM_SECTIONS.find(s => s.id === 'deficiency');
  const totalDefWeight = deficiencySection.params.reduce((sum, p) => sum + (params[p.key] || 0), 0);
  const isDeficiencyValid = Math.abs(totalDefWeight - 1.0) < 0.005;

  // Chart for weight distribution
  const weightChartOption = useMemo(() => {
    const section = PARAM_SECTIONS.find(s => s.id === activeSection);
    if (!section) return {};
    return {
      tooltip: { trigger: 'item', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f8fafc', fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: '#0f172a', borderWidth: 3 },
        label: { show: false },
        data: section.params.map((p, i) => ({
          name: p.label,
          value: params[p.key],
          itemStyle: { color: COLORS[i % COLORS.length] }
        }))
      }]
    };
  }, [activeSection, params]);

  const currentSection = PARAM_SECTIONS.find(s => s.id === activeSection);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Left: Section Nav */}
      <div style={{
        width: '240px', minWidth: '240px', background: 'rgba(0,0,0,0.3)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        padding: '16px 0'
      }}>
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Settings size={18} color="#38bdf8" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>Engine Config</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>BMS Ranking Parameters</span>
        </div>

        <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {PARAM_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeSection === section.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                color: activeSection === section.id ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left',
                transition: 'all 0.15s ease', width: '100%'
              }}
            >
              {section.icon}
              <span style={{ flex: 1 }}>{section.title}</span>
              <ChevronRight size={14} style={{ opacity: activeSection === section.id ? 1 : 0.3 }} />
            </button>
          ))}
        </div>

        {/* Validation Panel at Bottom */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            padding: '12px', borderRadius: '8px',
            background: isDeficiencyValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isDeficiencyValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '6px' }}>Weight Sum</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: isDeficiencyValid ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
              {totalDefWeight.toFixed(2)}
            </div>
            {!isDeficiencyValid && (
              <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Must equal 1.00
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Parameter Editor */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="modern-scroll">
        {savedMessage && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px', borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600
          }}>
            <CheckCircle size={16} /> {savedMessage}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            {currentSection?.icon}
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>{currentSection?.title}</h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{currentSection?.description}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 180px',
            padding: '8px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.5px', color: '#475569', borderBottom: '1px solid var(--border)'
          }}>
            <span>Parameter</span>
            <span style={{ textAlign: 'center' }}>Value</span>
            <span>Distribution</span>
          </div>

          {currentSection?.params.map((pDef, idx) => {
            const val = params[pDef.key];
            const maxInSection = Math.max(...currentSection.params.map(p => params[p.key]));
            const barPct = maxInSection > 0 ? (val / maxInSection) * 100 : 0;
            const color = COLORS[idx % COLORS.length];
            const isEditing = editingKey === pDef.key;

            return (
              <div
                key={pDef.key}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 180px',
                  padding: '14px 16px', borderRadius: '8px', alignItems: 'center',
                  background: isEditing ? 'rgba(56, 189, 248, 0.06)' : 'rgba(30, 41, 59, 0.3)',
                  border: `1px solid ${isEditing ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Label + Description */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    {pDef.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', paddingLeft: '16px' }}>{pDef.desc}</div>
                </div>

                {/* Inline Editable Value */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <input
                    type="number"
                    value={isEditing ? val : val}
                    min={pDef.min}
                    max={pDef.max}
                    step={pDef.step}
                    onFocus={() => setEditingKey(pDef.key)}
                    onBlur={() => setEditingKey(null)}
                    onChange={(e) => handleParamChange(pDef.key, e.target.value, pDef)}
                    style={{
                      width: '80px', padding: '6px 8px', fontSize: '14px', fontWeight: 700,
                      fontFamily: 'monospace', textAlign: 'center',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px', color: '#f8fafc', outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                </div>

                {/* Visual Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barPct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}88)`,
                      borderRadius: '3px', transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', minWidth: '36px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {pDef.suffix !== undefined ? `${val}${pDef.suffix}` : val.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formula Preview */}
        {activeSection === 'deficiency' && (
          <div style={{
            marginTop: '24px', padding: '16px', background: '#0f172a',
            border: '1px solid #1e293b', borderRadius: '8px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={12} /> Live Formula Preview
            </div>
            <code style={{ fontSize: '13px', color: '#38bdf8', lineHeight: 1.8 }}>
              DI = {params.conditionWeight.toFixed(2)}·DC + {params.verticalClearanceWeight.toFixed(2)}·DV + {params.horizontalClearanceWeight.toFixed(2)}·DH + {params.alignmentWeight.toFixed(2)}·DA + {params.trafficFactorWeight.toFixed(2)}·DT
            </code>
          </div>
        )}

        {activeSection === 'constants' && (
          <div style={{
            marginTop: '24px', padding: '16px', background: '#0f172a',
            border: '1px solid #1e293b', borderRadius: '8px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={12} /> Live Formula Preview
            </div>
            <code style={{ fontSize: '13px', color: '#38bdf8', lineHeight: 1.8 }}>
              DC = 100 × (ADT / {params.ADTB})<sup style={{ fontSize: '10px' }}>{params.K4}</sup> × Σ(k<sub>i</sub> · w<sub>i</sub>)
            </code>
          </div>
        )}

        {/* Strategic Override Toggle */}
        {activeSection === 'overrides' && (
          <div style={{
            marginTop: '24px', padding: '16px', background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
            display: 'flex', alignItems: 'flex-start', gap: '12px'
          }}>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, marginTop: '2px' }}>
              <input
                type="checkbox"
                checked={params.strategicImportanceFactor}
                onChange={(e) => setParams(prev => ({ ...prev, strategicImportanceFactor: e.target.checked }))}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                background: params.strategicImportanceFactor ? '#10b981' : '#334155',
                borderRadius: '12px', transition: 'all 0.3s ease'
              }}>
                <span style={{
                  position: 'absolute', width: '18px', height: '18px', borderRadius: '50%',
                  background: '#fff', top: '3px',
                  left: params.strategicImportanceFactor ? '23px' : '3px',
                  transition: 'left 0.3s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }} />
              </span>
            </label>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Enable Strategic Importance Override</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>
                When enabled, bridges on designated essential supply routes (UNRA Class I and II) will receive a penalty reduction of {params.strategicPenaltyReduction}% in the overall deficiency ranking, elevating their intervention priority.
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingBottom: '24px' }}>
          <button
            onClick={handleSave}
            disabled={!isDeficiencyValid}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', fontSize: '14px', fontWeight: 600,
              background: isDeficiencyValid ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#334155',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: isDeficiencyValid ? 'pointer' : 'not-allowed',
              opacity: isDeficiencyValid ? 1 : 0.5,
              boxShadow: isDeficiencyValid ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </div>

      {/* Right: Visual Summary */}
      <div style={{
        width: '260px', minWidth: '260px', background: 'rgba(0,0,0,0.2)',
        borderLeft: '1px solid var(--border)', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '12px' }}>
            Weight Distribution
          </div>
          <div style={{ height: '200px' }}>
            <ReactECharts option={weightChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {currentSection?.params.map((p, i) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ color: '#94a3b8', flex: 1 }}>{p.label}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace', fontSize: '11px' }}>
                {params[p.key] >= 10 ? params[p.key] : params[p.key].toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div style={{
          marginTop: 'auto', padding: '12px', borderRadius: '8px',
          background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Info size={12} color="#38bdf8" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reference</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            Parameters based on the MoWT Bridge Management System User Manual (January 2017), Tables 3, 8, 9 and 10.
          </p>
        </div>
      </div>
    </div>
  );
}
