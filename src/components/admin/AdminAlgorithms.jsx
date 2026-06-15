import { 
  Calculator, 
  TrendingUp,
  AlertTriangle,
  GitBranch,
  Settings2,
  BrainCircuit,
  Camera
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
        {/* Rating Algorithm */}
        <div className="algo-tech-card">
          <div className="algo-tech-header">
            <Calculator size={16} className="tech-icon blue" />
            <span className="tech-title">CONDITION_RATING_CALC</span>
          </div>
          <div className="tech-desc">Calculates macroscopic structural health from component inspections.</div>
          
          <div className="code-block">
            <code>Condition = Σ(ElementScore × ElementWeight) / Σ(ElementWeights)</code>
          </div>
          
          <div className="decision-tree">
            <div className="dt-node root-node">Bridge (100%)</div>
            <div className="dt-branches">
              <div className="dt-branch">
                <div className="dt-node sub-node">Superstructure (40%)</div>
                <div className="dt-leaf">Girders, Trusses, Arches</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">Substructure (40%)</div>
                <div className="dt-leaf">Piers, Abutments, Foundations</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">Deck (20%)</div>
                <div className="dt-leaf">Surface, Joints, Railings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Demand */}
        <div className="algo-tech-card">
          <div className="algo-tech-header">
            <TrendingUp size={16} className="tech-icon green" />
            <span className="tech-title">TRAFFIC_DEMAND_PROJECTION</span>
          </div>
          <div className="tech-desc">Projects future AADT using regional factors and historical census data.</div>
          
          <div className="code-block">
            <code>AADT_Future = AADT_Base × (1 + GrowthFactor)^Years</code>
          </div>

          <div className="param-table-wrapper">
            <table className="tech-param-table">
              <thead>
                <tr>
                  <th>PARAMETER</th>
                  <th>VALUE</th>
                  <th>TYPE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>BaseYear</td>
                  <td className="tech-val">2026</td>
                  <td className="tech-type">INT</td>
                </tr>
                <tr>
                  <td>Growth_Corridor</td>
                  <td className="tech-val">0.045</td>
                  <td className="tech-type">FLOAT</td>
                </tr>
                <tr>
                  <td>Growth_Feeder</td>
                  <td className="tech-val">0.028</td>
                  <td className="tech-type">FLOAT</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Ranking */}
        <div className="algo-tech-card full-width">
          <div className="algo-tech-header">
            <AlertTriangle size={16} className="tech-icon red" />
            <span className="tech-title">INTERVENTION_PRIORITY_RANKING</span>
          </div>
          <div className="tech-desc">Generates the national ranked list of structures requiring immediate intervention based on deficiency, traffic, and vulnerability.</div>
          
          <div className="code-block">
            <code>PriorityScore = (W_Cond × CondDeficit) + (W_Traf × Log(AADT)) + (W_Risk × ScourRisk)</code>
          </div>

          <div className="decision-tree horizontal">
            <div className="dt-node root-node"><GitBranch size={14}/> Priority Engine</div>
            <div className="dt-branches row-layout">
              <div className="dt-branch">
                <div className="dt-node sub-node">CondDeficit (50%)</div>
                <div className="dt-leaf">100 - ConditionRating</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">Log(AADT) (30%)</div>
                <div className="dt-leaf">Economic Impact Weight</div>
              </div>
              <div className="dt-branch">
                <div className="dt-node sub-node">ScourRisk (20%)</div>
                <div className="dt-leaf">Vulnerability Multiplier</div>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Deterioration LSTM */}
        <div className="algo-tech-card full-width">
          <div className="algo-tech-header">
            <BrainCircuit size={16} className="tech-icon purple" />
            <span className="tech-title">PREDICTIVE_DETERIORATION_LSTM</span>
          </div>
          <div className="tech-desc">Time-series forecasting of structural degradation curves using Long Short-Term Memory (LSTM) neural networks trained on historical inspection data.</div>
          
          <div className="code-block">
            <code>Condition_{'{t+1}'} = LSTM(Condition_{'{0..t}'}, Traffic_{'{t}'}, Climate_{'{t}'})</code>
          </div>

          <div className="decision-tree horizontal">
            <div className="dt-node root-node" style={{background: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#ec4899'}}>
              <TrendingUp size={14}/> Input: Time-Series sequence
            </div>
            <div className="dt-branches row-layout" style={{alignItems: 'center'}}>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderStyle: 'dashed'}}>LSTM Layer 1</div>
              </div>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderStyle: 'dashed'}}>LSTM Layer 2</div>
              </div>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderStyle: 'dashed'}}>Dense (Features)</div>
              </div>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderColor: '#ec4899', color: '#ec4899'}}>Output: Degradation Curve</div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Learning Vision */}
        <div className="algo-tech-card full-width">
          <div className="algo-tech-header">
            <BrainCircuit size={16} className="tech-icon purple" />
            <span className="tech-title">DEEP_LEARNING_VISION_MODEL</span>
          </div>
          <div className="tech-desc">Processes photometric point clouds and drone imagery using Convolutional Neural Networks to automatically classify and quantify structural defects.</div>
          
          <div className="code-block">
            <code>Defect_Probability = Softmax(CNN_Features × W_Output + b_Output)</code>
          </div>

          <div className="decision-tree horizontal">
            <div className="dt-node root-node" style={{background: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#ec4899'}}>
              <Camera size={14}/> Input: Drone Image
            </div>
            <div className="dt-branches row-layout" style={{alignItems: 'center'}}>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderStyle: 'dashed'}}>Conv2D (Features)</div>
              </div>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderStyle: 'dashed'}}>MaxPooling</div>
              </div>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderStyle: 'dashed'}}>Dense Layers</div>
              </div>
              <span style={{color: '#64748b', fontSize: '12px'}}>→</span>
              <div className="dt-branch">
                <div className="dt-node sub-node" style={{borderColor: '#ec4899', color: '#ec4899'}}>Output: Spalling (98%)</div>
              </div>
            </div>
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
