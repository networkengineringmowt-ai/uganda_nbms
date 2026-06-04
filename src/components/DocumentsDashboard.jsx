import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';

export default function DocumentsDashboard() {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/uganda_bms/data/documents.json')
      .then(res => res.json())
      .then(setDocs)
      .catch(console.error);
  }, []);

  if (docs.length === 0) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Indexing Document Corpus...</p>
    </div>
  );

  const filtered = docs.filter(d => 
    d.filename.toLowerCase().includes(search.toLowerCase()) || 
    d.snippet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Search inspection reports, PDFs, and DOCX..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', 
            outline: 'none', fontSize: '1rem', fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {filtered.map((doc, i) => (
          <div key={i} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--accent-cyan)" /> {doc.filename}
              </h4>
              <span className={`badge ${doc.type === 'PDF' ? 'cyan' : 'purple'}`}>{doc.type} • {doc.size_mb} MB</span>
            </div>
            <p className="document-text" style={{ fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
              "...{doc.snippet}..."
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
