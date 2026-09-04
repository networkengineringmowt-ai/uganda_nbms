import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  GitBranch,
  Settings2
} from 'lucide-react';

export default function AdminAlgorithms() {
  return (
    <div className="admin-algo-root">
      <div className="algo-header-bar">
        <div>
          <h1 className="algo-title"><Settings2 size={20} /> Algorithms & Decision Logic</h1>
          <p className="algo-subtitle">System parameters and formulas used by the BMS Engine. Configured via the Administration Module.</p>
        </div>
      </div>

      <div className="algo-dense-grid">
        {/* Bridge Overall Condition Rating -- bmsAlgorithms.js calculateBridgeOverallRating(),
            used consistently on the Inspect Bridge capture form, the Bridge
            Detail Card, and every ranking list. Weights depend on which
            condition band (0-2 / 3-4 / 5-9) each component's own rating falls in,
            per Table 3 of the 2017 UNRA BMS manual -- not a fixed 40/40/20 split. */}
        <div className="algo-tech-card full-width">
          <div className="algo-tech-header">
            <Calculator size={16} className="tech-icon blue" />
            <span className="tech-title">BRIDGE_OVERALL_CONDITION_RATING</span>
          </div>
          <div className="tech-desc">Weighted average of the five component ratings entered on a bridge inspection (Approaches, Waterway, Substructure, Superstructure, Roadway). Each component's weight depends on how severe its own rating is -- a badly-rated component counts for more, not less.</div>

          <div className="code-block">
            <code>Overall = Σ(weight[component][rating] × rating) / Σ(weight[component][rating])</code>
          </div>

          <div className="param-table-wrapper">
            <table className="tech-param-table">
              <thead>
                <tr>
                  <th>COMPONENT</th>
                  <th>RATING 0-2</th>
                  <th>RATING 3-4</th>
                  <th>RATING 5-9</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Substructure</td><td className="tech-val">8</td><td className="tech-val">4</td><td className="tech-val">2</td></tr>
                <tr><td>Superstructure</td><td className="tech-val">8</td><td className="tech-val">4</td><td className="tech-val">2</td></tr>
                <tr><td>Waterway</td><td className="tech-val">8</td><td className="tech-val">2</td><td className="tech-val">1</td></tr>
                <tr><td>Roadway</td><td className="tech-val">6</td><td className="tech-val">2</td><td className="tech-val">0.5</td></tr>
                <tr><td>Approaches</td><td className="tech-val">6</td><td className="tech-val">2</td><td className="tech-val">0.25</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Culvert Overall Condition Rating -- bmsAlgorithms.js calculateCulvertOverallRating(),
            wired into the Inspect Culvert capture form and shown on the Culvert Print Report. */}
        <div className="algo-tech-card">
          <div className="algo-tech-header">
            <Calculator size={16} className="tech-icon green" />
            <span className="tech-title">CULVERT_OVERALL_CONDITION_RATING</span>
          </div>
          <div className="tech-desc">Fixed-weight average of the four culvert component ratings (Waterway, Inlet/Outlet, Structure, Roadway).</div>

          <div className="code-block">
            <code>Overall = Σ(weight[component] × rating) / Σ(weight[component])</code>
          </div>

          <div className="param-table-wrapper">
            <table className="tech-param-table">
              <thead><tr><th>COMPONENT</th><th>WEIGHT</th></tr></thead>
              <tbody>
                <tr><td>Structure</td><td className="tech-val">45%</td></tr>
                <tr><td>Inlet / Outlet</td><td className="tech-val">25%</td></tr>
                <tr><td>Waterway</td><td className="tech-val">20%</td></tr>
                <tr><td>Roadway</td><td className="tech-val">10%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic -- there is no fixed global growth-rate table; each link's
            AADT growth is a per-record field carried through from the traffic
            dataset, not projected from a system-wide constant. */}
        <div className="algo-tech-card">
          <div className="algo-tech-header">
            <TrendingUp size={16} className="tech-icon green" />
            <span className="tech-title">TRAFFIC_AADT</span>
          </div>
          <div className="tech-desc">AADT and its annual growth rate are read per road link directly from the traffic survey dataset (field <code>annual_weighted_growth_rate</code>) -- the system does not project future traffic from a fixed corridor/feeder growth constant.</div>
          <div className="code-block">
            <code>AADT_shown = Traffic.aadt_2026 (from survey, per link)</code>
          </div>
        </div>

        {/* Bridge Condition Deficiency Index -- bmsAlgorithms.js
            calculateBridgeDeficiencyIndex(), used consistently on the Inspect
            Bridge form's live preview, the Bridge Detail Card, and every
            ranking list. This is a condition-only index -- full traffic and
            geometry data (ADTO, VCG, VCM) for the manual's traffic-scaled
            variant is rarely fully populated in the source data, so this
            platform implements the condition-based DC term only. */}
        <div className="algo-tech-card full-width">
          <div className="algo-tech-header">
            <AlertTriangle size={16} className="tech-icon red" />
            <span className="tech-title">BRIDGE_CONDITION_DEFICIENCY_INDEX</span>
          </div>
          <div className="tech-desc">Scores a bridge's condition deficiency from 0 (perfect) to 100 (critical), based on component condition ratings, per the 2017 UNRA BMS manual (Tables 8-10). This is what drives the Deficiency Score shown on the bridge detail view and every ranking list -- it is not part of a machine-learning ranking model.</div>

          <div className="code-block">
            <code>DC = 100 × Σ(k[component][rating] × w[component]) / Σ(w[component])</code>
          </div>

          <div className="decision-tree horizontal">
            <div className="dt-node root-node"><GitBranch size={14}/> Component weights (w)</div>
            <div className="dt-branches row-layout">
              <div className="dt-branch">
                <div className="dt-node sub-node">Superstructure / Substructure</div>
                <div className="dt-leaf">1.00</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">Waterway</div>
                <div className="dt-leaf">0.83</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">Roadway</div>
                <div className="dt-leaf">0.50</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">Approach</div>
                <div className="dt-leaf">0.25</div>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Valuation -- bmsAlgorithms.js calculateAssetValue(), used on the
            Bridge/Culvert Detail Card and the printed structural reports. */}
        <div className="algo-tech-card full-width">
          <div className="algo-tech-header">
            <Calculator size={16} className="tech-icon blue" />
            <span className="tech-title">ASSET_VALUATION_CRC_CDRC</span>
          </div>
          <div className="tech-desc">Current Replacement Cost (CRC) is estimated from deck area at a fixed unit rate; Current Depreciated Replacement Cost (CDRC) scales CRC down by the structure's own overall condition rating out of 9.</div>
          <div className="code-block">
            <code>CRC = Length × Width × UnitCost(UGX/m²) × HeightFactor{'\n'}CDRC = CRC × (OverallRating / 9)</code>
          </div>
        </div>
      </div>

      <style>{`
        .admin-algo-root {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .algo-header-bar {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--border);
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
        }
        .algo-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .algo-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          font-family: monospace;
        }
        .algo-dense-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 16px;
        }
        .algo-tech-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .algo-tech-card.full-width {
          grid-column: 1 / -1;
        }
        .algo-tech-header {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 8px;
        }
        .tech-icon {
          padding: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .tech-icon.blue { color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
        .tech-icon.green { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .tech-icon.red { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .tech-icon.purple { color: #ec4899; background: rgba(236, 72, 153, 0.1); }
        .tech-title {
          font-family: 'Fira Code', monospace;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
        }
        .tech-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .code-block {
          background: #000;
          border: 1px solid #1e293b;
          border-radius: 4px;
          padding: 8px 12px;
          overflow-x: auto;
        }
        .code-block code {
          font-family: 'Fira Code', monospace;
          color: #10b981;
          font-size: 12px;
          white-space: nowrap;
        }
        .param-table-wrapper {
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .tech-param-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          font-family: 'Fira Code', monospace;
        }
        .tech-param-table th {
          background: rgba(0,0,0,0.5);
          color: var(--text-muted);
          text-align: left;
          padding: 6px 12px;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }
        .tech-param-table td {
          padding: 6px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: var(--text-secondary);
        }
        .tech-param-table tr:last-child td { border-bottom: none; }
        .tech-val { color: #38bdf8 !important; font-weight: 600; }
        .tech-type { color: #f59e0b !important; }
        
        .decision-tree {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .dt-node {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .root-node {
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          align-self: flex-start;
        }
        .dt-branches {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-left: 16px;
          border-left: 1px dashed var(--border);
          margin-left: 12px;
        }
        .dt-branches.row-layout {
          flex-direction: row;
          gap: 16px;
          border-left: none;
          padding-left: 0;
          margin-left: 0;
          margin-top: 8px;
        }
        .dt-branch {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dt-branches:not(.row-layout) .dt-branch {
          position: relative;
        }
        .dt-branches:not(.row-layout) .dt-branch::before {
          content: '';
          position: absolute;
          left: -16px;
          top: 10px;
          width: 12px;
          height: 1px;
          background: var(--border);
          border-top: 1px dashed var(--border);
        }
        .sub-node {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }
        .dt-leaf {
          font-size: 10px;
          color: var(--text-muted);
          padding-left: 8px;
        }
      `}</style>
    </div>
  );
}
