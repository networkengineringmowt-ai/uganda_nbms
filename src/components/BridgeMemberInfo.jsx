import { useEffect, useMemo, useState } from 'react';
import { Box, Camera, Gauge, Layers, MapPin, Ruler, Search, ShieldAlert, X } from 'lucide-react';
import DigitalTwin from './DigitalTwin';
import { TYPE_BRIDGE, TYPE_DECK_MATERIAL, getConditionLabel, getDictionaryLabel } from '../utils/dataDictionary';

const getId = (asset) => asset?.BridgeNumber || asset?.CulvertNumber;
const getName = (asset) => asset?.BridgeName || asset?.River || asset?.Road || getId(asset);
const value = (legacy, ...keys) => keys.map((key) => legacy[key]).find((item) => item !== undefined && item !== null && item !== '') ?? '-';
const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const modes = [
  { id: 'hybrid', label: 'Hybrid', icon: Layers },
  { id: 'constructed', label: 'Constructed', icon: Box },
  { id: 'reconstructed', label: 'Reconstructed', icon: Layers },
  { id: 'photorealism', label: 'Photorealism', icon: Camera },
];

export default function BridgeMemberInfo({ bridges = [], culverts = [] }) {
  const assets = useMemo(() => [...bridges, ...culverts], [bridges, culverts]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [manifest, setManifest] = useState([]);
  const [mode, setMode] = useState('hybrid');
  const [measurement, setMeasurement] = useState(null);
  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}gallery/index.json`).then((response) => response.json()),
      fetch(`${BASE_URL}twins/manifest.json`).then((response) => response.json()),
    ]).then(([photoRows, twinRows]) => {
      setGallery(photoRows);
      setManifest(twinRows);
    }).catch(console.error);
  }, []);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assets.filter((asset) => !term || `${getId(asset)} ${getName(asset)} ${asset.Region || ''}`.toLowerCase().includes(term));
  }, [assets, query]);

  const selected = assets.find((asset) => getId(asset) === selectedId) || filtered[0];
  const legacy = selected?.LegacyData || selected || {};
  const isCulvert = Boolean(selected?.CulvertNumber);
  const selectedPhotos = gallery.filter((photo) => photo.structure_id === getId(selected) && !photo.duplicate_of);
  const reconstruction = manifest.find((row) => row.structure_id === getId(selected));
  const components = isCulvert
    ? [
      ['Structure', legacy.structure_rating],
      ['Waterway', legacy.waterway_rating],
      ['Roadway', legacy.roadway_rating],
    ]
    : [
      ['Superstructure', legacy.superstructure_rating],
      ['Substructure', legacy.substructure_rating],
      ['Roadway', legacy.roadway_rating],
      ['Waterway', legacy.waterway_rating],
    ];

  return (
    <div className="twin-workspace">
      <aside className="twin-asset-pane">
        <div>
          <span className="panel-kicker">Parametric asset models</span>
          <h1>Structure digital twins</h1>
        </div>
        <label className="photo-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find structure" /></label>
        <div className="twin-asset-list">
          {filtered.map((asset) => (
            <button key={getId(asset)} className={getId(selected) === getId(asset) ? 'active' : ''} onClick={() => setSelectedId(getId(asset))}>
              <Box size={16} /><span><strong>{getId(asset)}</strong><small>{getName(asset)}</small></span>
            </button>
          ))}
        </div>
      </aside>

      <section className="twin-main">
        <div className="twin-heading">
          <div><span className="panel-kicker">{isCulvert ? 'Major culvert' : 'Bridge'} digital twin</span><h2>{getId(selected)} - {getName(selected)}</h2></div>
          <span><MapPin size={14} /> {selected?.Region || legacy.region || 'Unknown region'}</span>
        </div>
        <div className="twin-mode-toolbar" aria-label="Digital twin view mode">
          {modes.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={mode === item.id ? 'active' : ''} onClick={() => setMode(item.id)}><Icon size={14} />{item.label}</button>;
          })}
          <span className={`twin-quality ${reconstruction?.point_cloud_url ? 'registered' : ''}`}>
            {reconstruction?.point_cloud_url ? 'Registered cloud' : `${selectedPhotos.length} views ready`}
          </span>
        </div>
        <div className="twin-measure-toolbar" aria-label="Digital twin measurement tools">
          <span><Ruler size={14} /> Measure layer</span>
          {['length', 'width', 'height'].map((axis) => (
            <button key={axis} className={measurement === axis ? 'active' : ''} onClick={() => setMeasurement(axis)} title={`Measure ${axis}`}>
              {axis}
            </button>
          ))}
          {measurement && <button className="clear" onClick={() => setMeasurement(null)} title="Clear measurement"><X size={13} /></button>}
        </div>
        <DigitalTwin asset={selected} isCulvert={isCulvert} large photos={selectedPhotos} reconstruction={reconstruction} mode={mode} measurement={measurement} />
        <div className="twin-accuracy-note">
          <ShieldAlert size={16} />
          <span><strong>Accuracy control:</strong> dimensions shown by the model are authoritative BMS inventory values. A reconstructed cloud becomes survey-certified only after registering measured control points.</span>
        </div>
        <div className="twin-data-band">
          <div className="twin-attributes">
            <h3><Layers size={16} /> Model attributes</h3>
            <dl>
              <div><dt>Structural type</dt><dd>{isCulvert ? value(selected, 'Type') : getDictionaryLabel(TYPE_BRIDGE, legacy.type_bridge)}</dd></div>
              <div><dt>Material</dt><dd>{getDictionaryLabel(TYPE_DECK_MATERIAL, legacy.type_deck_material)}</dd></div>
              <div><dt>Length</dt><dd>{value(legacy, 'length', 'bridge_len', 'culvert_len')} m</dd></div>
              <div><dt>Width</dt><dd>{value(legacy, 'width', 'bridge_wid', 'overall_width')} m</dd></div>
              <div><dt>Spans / cells</dt><dd>{value(legacy, 'no_of_spans', 'no_of_span', 'no_of_pipes')}</dd></div>
              <div><dt>Road link</dt><dd>{selected?.RoadDescrPrincipal || selected?.Road || legacy.link_name || '-'}</dd></div>
              <div><dt>Photo views</dt><dd>{selectedPhotos.length}</dd></div>
              <div><dt>Reconstruction</dt><dd>{reconstruction?.reconstruction_status || 'Manifest pending'}</dd></div>
              <div><dt>Dimension source</dt><dd>{reconstruction?.authoritative_dimensions?.dimension_source || 'BMS inventory record'}</dd></div>
            </dl>
          </div>
          <div className="twin-components">
            <h3><Gauge size={16} /> Component condition</h3>
            {components.map(([label, rating]) => (
              <div key={label}><span>{label}</span><div><i style={{ width: `${Math.max(0, Number(rating) || 0) * 11.11}%` }} /></div><strong>{getConditionLabel(rating)}</strong></div>
            ))}
            <div className="twin-survey-row"><Ruler size={14} /><span>Survey control</span><strong>{reconstruction?.authoritative_dimensions?.survey_control_status || 'not registered'}</strong></div>
          </div>
        </div>
      </section>
    </div>
  );
}
