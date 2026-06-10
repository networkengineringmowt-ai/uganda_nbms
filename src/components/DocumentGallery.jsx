import { useState, useEffect } from 'react';
import { fetchDocuments, fetchDocumentPhotos } from '../services/bmsDataService';
import { Search, Image as ImageIcon, FileText, Download, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

export default function DocumentGallery({ bridges = [] }) {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' or 'documents'
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBridgeId, setSelectedBridgeId] = useState('');

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'photos') {
          const data = await fetchDocumentPhotos(page, 50);
          if (!ignore) setPhotos(data || []);
        } else {
          const data = await fetchDocuments(page, 50);
          if (!ignore) setDocuments(data || []);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    
    loadData();
    return () => { ignore = true; };
  }, [page, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));

  // Filter local results based on search and selected bridge
  const effectiveSearchTerm = selectedBridgeId ? selectedBridgeId.toLowerCase() : searchTerm.toLowerCase();

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(effectiveSearchTerm) || 
    (doc.snippet && doc.snippet.toLowerCase().includes(effectiveSearchTerm))
  );
  
  const filteredPhotos = photos.filter(photo => 
    photo.filename.toLowerCase().includes(effectiveSearchTerm)
  );

  return (
    <div className="bms-panel-container" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <div className="flex-between" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ImageIcon size={24} /> Offline Document & Media Gallery
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`bms-button ${activeTab === 'photos' ? 'primary' : ''}`}
            onClick={() => handleTabChange('photos')}
          >
            <ImageIcon size={16} /> Photos
          </button>
          <button 
            className={`bms-button ${activeTab === 'documents' ? 'primary' : ''}`}
            onClick={() => handleTabChange('documents')}
          >
            <FileText size={16} /> Documents
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            className="bms-select"
            value={selectedBridgeId}
            onChange={(e) => {
              setSelectedBridgeId(e.target.value);
              setSearchTerm('');
            }}
            style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
          >
            <option value="">-- Filter by Bridge/Link --</option>
            {bridges.map(b => (
              <option key={b.BridgeNumber} value={b.BridgeNumber}>
                {b.BridgeNumber} - {b.BridgeName} ({b.RoadDescrPrincipal})
              </option>
            ))}
          </select>

          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bms-white)', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc', width: '300px', opacity: selectedBridgeId ? 0.5 : 1 }}>
            <Search size={16} color="#666" />
            <input 
              type="text" 
              placeholder="Or type to filter current page..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!!selectedBridgeId}
              style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', background: 'transparent' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="bms-button" onClick={handlePrevPage} disabled={page === 0 || loading}>
            <ChevronLeft size={16} /> Prev
          </button>
          <span>Page {page + 1}</span>
          <button className="bms-button" onClick={handleNextPage} disabled={loading || (activeTab === 'photos' ? photos.length < 50 : documents.length < 50)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader size={32} className="spinning" />
          <p>Loading files from Supabase...</p>
        </div>
      )}
      {error && <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>}

      {!loading && !error && activeTab === 'photos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filteredPhotos.length === 0 ? <p>No photos found on this page.</p> : null}
          {filteredPhotos.map(photo => (
            <div key={photo.id} style={{ border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
              <div style={{ height: '150px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photo.storage_url ? (
                  <img src={photo.storage_url} alt={photo.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} loading="lazy" />
                ) : (
                  <ImageIcon size={32} color="#ccc" />
                )}
              </div>
              <div style={{ padding: '8px', fontSize: '12px', wordBreak: 'break-all' }}>
                {photo.filename}
                {photo.storage_url && (
                  <a href={photo.storage_url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '4px', color: 'var(--bms-blue)' }}>
                    <Download size={12} /> Open Full
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && activeTab === 'documents' && (
        <table className="bms-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size (MB)</th>
              <th>Extracted Text Snippet</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? <tr><td colSpan="5">No documents found on this page.</td></tr> : null}
            {filteredDocs.map(doc => (
              <tr key={doc.id}>
                <td style={{ fontWeight: '500' }}>{doc.filename}</td>
                <td><span style={{ padding: '2px 6px', background: '#e1e8ed', borderRadius: '4px', fontSize: '12px' }}>{doc.file_type}</span></td>
                <td>{doc.size_mb}</td>
                <td style={{ fontSize: '12px', color: '#555', maxWidth: '400px' }}>
                  {doc.snippet ? doc.snippet.substring(0, 150) + '...' : 'No text extracted'}
                </td>
                <td>
                  {doc.storage_url ? (
                    <a href={doc.storage_url} target="_blank" rel="noreferrer" className="bms-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      <Download size={14} /> View
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
