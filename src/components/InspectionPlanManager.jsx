import { useState } from 'react';
import { Calendar, CheckCircle, Search, Download } from 'lucide-react';

export default function InspectionPlanManager() {
  const [plans] = useState([
    { id: 1, name: 'Kajjansi IC Regular', bridge: 'Kajjansi IC', period: '2026-05 to 2026-06', status: 'In Progress', progress: 65 },
    { id: 2, name: 'Nile Bridge Casual', bridge: 'New Jinja Nile', period: '2026-04', status: 'Completed', progress: 100 },
    { id: 3, name: 'Karuma Routine', bridge: 'Karuma Falls', period: '2026-07', status: 'Planned', progress: 0 }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', padding: '24px' }}>
      
      {/* Top controls */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search plans..." style={{ padding: '8px 12px 8px 36px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', width: '250px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }} />
          </div>
          <select style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }}>
            <option>All Types</option>
            <option>Routine</option>
            <option>Casual</option>
            <option>Regular</option>
            <option>Principal</option>
          </select>
        </div>
        <button className="modern-btn-primary">
          + Add New Plan
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
        {/* List & Gantt View */}
        <div className="glass-card" style={{ flex: 2, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Inspection Schedule (Gantt)
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{plan.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{plan.bridge} | {plan.period}</div>
                </div>
                <div style={{ width: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    <span>Progress</span>
                    <span>{plan.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${plan.progress}%`, background: plan.progress === 100 ? 'var(--accent-green)' : 'var(--accent-primary)' }}></div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: plan.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : plan.status === 'In Progress' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: plan.status === 'Completed' ? 'var(--accent-green)' : plan.status === 'In Progress' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  {plan.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress & Actions Panel */}
        <div className="glass-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '16px' }}>Execution & Results</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Select an inspection plan to manage execution. Download the ZIP package for the IC Client to complete on-site data entry.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="modern-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <Download size={16} /> Download ZIP (IC Client)
            </button>
            <button className="modern-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <Calendar size={16} /> Upload IC Results
            </button>
            <button className="modern-btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-green)', borderColor: 'var(--accent-green)', marginTop: '12px' }}>
              <CheckCircle size={16} /> Mark as Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
