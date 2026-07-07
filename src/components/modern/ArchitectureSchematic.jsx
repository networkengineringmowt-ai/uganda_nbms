import { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Camera, TrendingUp, CloudCog, Cpu, Smartphone, LayoutDashboard, ShieldCheck, Box, KeyRound, Server, Gauge, FileText, X, Activity, BrainCircuit } from 'lucide-react';
import AdminDocumentation from '../admin/AdminDocumentation';
import AuditTools from '../admin/AuditTools';

const EngineNode = ({ data, isConnectable, selected }) => {
  return (
    <div style={{
      background: selected ? 'rgba(56, 189, 248, 0.1)' : '#111827',
      border: `1px solid ${selected ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
      borderRadius: '12px',
      padding: '14px',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: '220px',
      boxShadow: selected ? '0 0 20px rgba(56, 189, 248, 0.2)' : '0 8px 30px rgba(0,0,0,0.6)',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} style={{ background: '#94a3b8', width: '6px', height: '6px', border: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: data.color || 'rgba(59, 130, 246, 0.1)', 
          color: data.iconColor || '#3b82f6',
          padding: '8px', 
          borderRadius: '8px', 
          display: 'flex',
          border: `1px solid ${data.iconColor || '#3b82f6'}`
        }}>
          {data.icon}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>{data.label}</h4>
          <span style={{ fontSize: '11px', color: '#64748b' }}>{data.subline}</span>
        </div>
      </div>
      
      {data.details && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
          {data.details.map((d, i) => (
            <div key={i} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>
              {d}
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} style={{ background: '#94a3b8', width: '6px', height: '6px', border: 'none' }} />
    </div>
  );
};

const nodeTypes = {
  engineNode: EngineNode,
};

const initialNodes = [
  // Inputs Layer (x: 0)
  {
    id: '1', type: 'engineNode', position: { x: 50, y: 150 },
    data: { 
      label: 'Legacy DB Ingest', subline: 'Data Import Module', 
      icon: <Database size={18} />, color: 'rgba(234, 88, 12, 0.1)', iconColor: '#ea580c',
      details: ['Access DB', 'SQL Extracts']
    }
  },
  {
    id: '2', type: 'engineNode', position: { x: 50, y: 300 },
    data: { 
      label: 'QField / Field Capture', subline: 'Offline inspection sync', 
      icon: <Smartphone size={18} />, color: 'rgba(234, 88, 12, 0.1)', iconColor: '#ea580c',
      details: ['Offline Mode', 'Open Standards']
    }
  },
  {
    id: '3', type: 'engineNode', position: { x: 50, y: 450 },
    data: { 
      label: 'Evidence & Photogrammetry', subline: 'Photos, clouds and meshes', 
      icon: <Camera size={18} />, color: 'rgba(234, 88, 12, 0.1)', iconColor: '#ea580c',
      details: ['COLMAP', 'Point Clouds']
    }
  },

  // Processing Engine Layer (x: 350)
  {
    id: '4', type: 'engineNode', position: { x: 350, y: 225 },
    data: { 
      label: 'PostGIS Authoritative Data', subline: 'Spatial records and audit', 
      icon: <ShieldCheck size={18} />, color: 'rgba(16, 185, 129, 0.1)', iconColor: '#10b981',
      details: ['Constraints', 'Audit Log']
    }
  },
  {
    id: '5', type: 'engineNode', position: { x: 350, y: 375 },
    data: { 
      label: 'MinIO Object Storage', subline: 'Evidence and reality twins', 
      icon: <CloudCog size={18} />, color: 'rgba(16, 185, 129, 0.1)', iconColor: '#10b981',
      details: ['Versioned', 'S3 API']
    }
  },

  // Analytics Core Layer (x: 650)
  {
    id: '6', type: 'engineNode', position: { x: 650, y: 300 },
    data: { 
      label: 'Catalog API + OGC Services', subline: 'GeoServer and pygeoapi', 
      icon: <Cpu size={18} />, color: 'rgba(139, 92, 246, 0.1)', iconColor: '#8b5cf6',
      details: ['WMS / WFS', 'OGC API']
    }
  },

  // Presentation Layer (x: 950)
  {
    id: '7', type: 'engineNode', position: { x: 950, y: 150 },
    data: { 
      label: 'Reality Digital Twin', subline: 'Cloud + structural overlay', 
      icon: <Box size={18} />, color: 'rgba(56, 189, 248, 0.1)', iconColor: '#38bdf8',
      details: ['Procedural']
    }
  },
  {
    id: '8', type: 'engineNode', position: { x: 950, y: 300 },
    data: { 
      label: 'GIS Applications', subline: 'BMS, QGIS and QField', 
      icon: <LayoutDashboard size={18} />, color: 'rgba(56, 189, 248, 0.1)', iconColor: '#38bdf8',
      details: ['GeoJSON']
    }
  },
  {
    id: '9', type: 'engineNode', position: { x: 950, y: 450 },
    data: { 
      label: 'Analytics and Reports', subline: 'ECharts and exports', 
      icon: <TrendingUp size={18} />, color: 'rgba(56, 189, 248, 0.1)', iconColor: '#38bdf8',
      details: ['Metrics']
    }
  },
  {
    id: '10', type: 'engineNode', position: { x: 350, y: 75 },
    data: {
      label: 'Keycloak Identity', subline: 'Users, roles and OIDC',
      icon: <KeyRound size={18} />, color: 'rgba(14, 165, 233, 0.1)', iconColor: '#38bdf8',
      details: ['RBAC', 'Service Accounts']
    }
  },
  {
    id: '11', type: 'engineNode', position: { x: 650, y: 75 },
    data: {
      label: 'Nginx Gateway + MapProxy', subline: 'Secure routing and tile cache',
      icon: <Server size={18} />, color: 'rgba(139, 92, 246, 0.1)', iconColor: '#a78bfa',
      details: ['Gateway', 'Cached Tiles']
    }
  },
  {
    id: '12', type: 'engineNode', position: { x: 650, y: 525 },
    data: {
      label: 'Prometheus + Grafana', subline: 'Health, metrics and alerts',
      icon: <Gauge size={18} />, color: 'rgba(139, 92, 246, 0.1)', iconColor: '#f59e0b',
      details: ['Monitoring', 'Alerts'],
      techDocs: 'Connects to /metrics endpoints across all services. Includes pre-built dashboards for API latency, GeoServer layer rendering times, and PostGIS transaction throughput.'
    }
  },
  {
    id: '13', type: 'engineNode', position: { x: 350, y: 525 },
    data: {
      label: 'Deep Learning Vision API', subline: 'Defect & Crack Detection',
      icon: <BrainCircuit size={18} />, color: 'rgba(236, 72, 153, 0.1)', iconColor: '#ec4899',
      details: ['PyTorch CNN', 'YOLOv8'],
      techDocs: 'Processes images from the Photo Evidence subsystem to detect spalling, cracking, and rust automatically using convolutional neural networks.'
    }
  },
  {
    id: '14', type: 'engineNode', position: { x: 650, y: 187 },
    data: {
      label: 'Predictive Deterioration ML', subline: 'Time-series Lifecycle Engine',
      icon: <BrainCircuit size={18} />, color: 'rgba(236, 72, 153, 0.1)', iconColor: '#ec4899',
      details: ['LSTM', 'Markov Chains'],
      techDocs: 'Consumes historical condition data from PostGIS to predict future degradation curves for bridges using Deep Learning (LSTMs).'
    }
  },
];

const animatedEdgeStyle = { stroke: '#8b5cf6', strokeWidth: 2 };

// Adding animated: true to ALL edges to create a flowing data visual effect
const initialEdges = [
  { id: 'e1-4', source: '1', target: '4', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e2-4', source: '2', target: '4', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e6-7', source: '6', target: '7', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e6-8', source: '6', target: '8', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e6-9', source: '6', target: '9', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e10-11', source: '10', target: '11', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e11-6', source: '11', target: '6', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e6-12', source: '6', target: '12', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e3-13', source: '3', target: '13', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e13-4', source: '13', target: '4', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e4-14', source: '4', target: '14', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e14-9', source: '14', target: '9', type: 'smoothstep', animated: true, style: animatedEdgeStyle, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
];

export default function ArchitectureSchematic() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTab, setActiveTab] = useState('schematic');
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('schematic')}
          style={{ background: activeTab === 'schematic' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'schematic' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <LayoutDashboard size={16} /> System Schematic
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          style={{ background: activeTab === 'docs' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'docs' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <FileText size={16} /> Admin Documentation
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          style={{ background: activeTab === 'audit' ? 'var(--accent-blue)' : 'transparent', color: activeTab === 'audit' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Activity size={16} /> Audit Tools
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'schematic' && (
          <div style={{ width: '100%', height: '100%', background: '#030a1b', display: 'flex' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={() => setSelectedNode(null)}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                colorMode="dark"
              >
                <Background color="#1e293b" gap={24} size={2} />
                <Controls style={{ display: 'none' }} />
                <MiniMap 
                  nodeColor={(node) => node.data.iconColor || '#1e293b'}
                  maskColor="rgba(3, 10, 27, 0.7)"
                  style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                />
              </ReactFlow>
            </div>
            
            {/* Slide-out Node Detail Pane */}
            <div style={{ 
              width: selectedNode ? '350px' : '0px', 
              background: '#0f172a', 
              borderLeft: selectedNode ? '1px solid var(--border)' : 'none',
              transition: 'width 0.3s ease',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {selectedNode && (
                <div style={{ padding: '24px', width: '350px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: selectedNode.data.color, color: selectedNode.data.iconColor, padding: '10px', borderRadius: '8px' }}>
                        {selectedNode.data.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>{selectedNode.data.label}</h3>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedNode.data.subline}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Technical Details</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
                        {selectedNode.data.techDocs || 'Core enterprise subsystem. Extensible via defined API contracts. Follows standard operational protocols for scaling and fault tolerance.'}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Capabilities</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(selectedNode.data.details || []).map((d, i) => (
                          <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px dashed #1e293b' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Node ID</span>
                        <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedNode.id}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span>Type</span>
                        <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedNode.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'docs' && <AdminDocumentation />}
        {activeTab === 'audit' && <AuditTools />}
      </div>
    </div>
  );
}
