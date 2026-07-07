import { Suspense, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { ContactShadows, Line, OrbitControls, Text } from '@react-three/drei';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, TextureLoader, Vector3 } from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { getPhotoUrl } from '../utils/photoUrlResolver';

const BASE_URL = import.meta.env.BASE_URL || '/uganda_bms/';
const numeric = (...values) => {
  const value = values.find((candidate) => Number.isFinite(Number(candidate)));
  return Number(value);
};

const ratingColor = (value) => {
  const rating = Number(value);
  if (rating >= 7) return '#33d69f';
  if (rating >= 5) return '#f5c451';
  if (rating >= 3) return '#fb8c4c';
  if (Number.isFinite(rating)) return '#ff5964';
  return '#79a7ff';
};

const getMetrics = (asset, isCulvert) => {
  const legacy = asset?.LegacyData || asset || {};
  const length = numeric(legacy.length, legacy.bridge_len, legacy.culvert_len, asset?.TotalLength, asset?.['Overall Length']) || (isCulvert ? 10 : 24);
  const width = numeric(legacy.width, legacy.bridge_wid, legacy.overall_width, asset?.OverallWidth, asset?.['Overall Width']) || (isCulvert ? 8 : 9);
  const spans = Math.min(12, Math.max(1, Math.round(numeric(legacy.no_of_spans, legacy.no_of_span, legacy.no_of_pipes, asset?.Spans, asset?.NoOfPipesOrCells) || 1)));
  const scale = Math.min(1, 28 / Math.max(length, width));
  return { legacy, length, width, spans, scale, height: isCulvert ? 3.2 : 5.2 };
};

const Rail = ({ z, length }) => (
  <group position={[0, 2.72, z]}>
    <mesh castShadow><boxGeometry args={[length, 0.08, 0.08]} /><meshStandardMaterial color="#d7e5ff" metalness={0.75} roughness={0.25} /></mesh>
    {Array.from({ length: Math.max(4, Math.round(length / 4)) }).map((_, index, rows) => (
      <mesh key={index} position={[-length / 2 + (index * length) / (rows.length - 1), -0.3, 0]} castShadow>
        <boxGeometry args={[0.07, 0.65, 0.07]} /><meshStandardMaterial color="#d7e5ff" metalness={0.75} roughness={0.25} />
      </mesh>
    ))}
  </group>
);

function DimensionTicks({ metrics }) {
  const { length, width } = metrics;
  const tick = '#e8f2ff';
  const lengthZ = -(width / 2 + 1.3);
  const widthX = length / 2 + 1.3;
  return (
    <group>
      <Line points={[[-length / 2, 3.25, lengthZ], [length / 2, 3.25, lengthZ]]} color={tick} lineWidth={1.4} />
      <Line points={[[-length / 2, 2.9, lengthZ], [-length / 2, 3.6, lengthZ]]} color={tick} lineWidth={1.4} />
      <Line points={[[length / 2, 2.9, lengthZ], [length / 2, 3.6, lengthZ]]} color={tick} lineWidth={1.4} />
      <Text position={[0, 3.62, lengthZ]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.45} color={tick} anchorX="center">
        {`LENGTH ${length.toFixed(2)} m`}
      </Text>

      <Line points={[[widthX, 3.25, -width / 2], [widthX, 3.25, width / 2]]} color={tick} lineWidth={1.4} />
      <Line points={[[widthX, 2.9, -width / 2], [widthX, 3.6, -width / 2]]} color={tick} lineWidth={1.4} />
      <Line points={[[widthX, 2.9, width / 2], [widthX, 3.6, width / 2]]} color={tick} lineWidth={1.4} />
      <Text position={[widthX, 3.62, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.42} color={tick} anchorX="center">
        {`WIDTH ${width.toFixed(2)} m`}
      </Text>
    </group>
  );
}

function ActiveMeasurement({ metrics, axis }) {
  if (!axis) return null;
  const color = '#22d3ee';
  const { length, width, height } = metrics;
  const tickSize = 0.45;
  const definitions = {
    length: {
      points: [[-length / 2, 4.25, 0], [length / 2, 4.25, 0]],
      ticks: [
        [[-length / 2, 4.25 - tickSize, 0], [-length / 2, 4.25 + tickSize, 0]],
        [[length / 2, 4.25 - tickSize, 0], [length / 2, 4.25 + tickSize, 0]],
      ],
      labelPosition: [0, 4.9, 0],
      labelRotation: [-Math.PI / 2, 0, 0],
      label: `MEASURED LENGTH ${length.toFixed(2)} m`,
    },
    width: {
      points: [[0, 4.25, -width / 2], [0, 4.25, width / 2]],
      ticks: [
        [[-tickSize, 4.25, -width / 2], [tickSize, 4.25, -width / 2]],
        [[-tickSize, 4.25, width / 2], [tickSize, 4.25, width / 2]],
      ],
      labelPosition: [0, 4.9, 0],
      labelRotation: [-Math.PI / 2, 0, Math.PI / 2],
      label: `MEASURED WIDTH ${width.toFixed(2)} m`,
    },
    height: {
      points: [[length / 2 + 1.6, 0, 0], [length / 2 + 1.6, height, 0]],
      ticks: [
        [[length / 2 + 1.15, 0, 0], [length / 2 + 2.05, 0, 0]],
        [[length / 2 + 1.15, height, 0], [length / 2 + 2.05, height, 0]],
      ],
      labelPosition: [length / 2 + 2.35, height / 2, 0],
      labelRotation: [0, 0, Math.PI / 2],
      label: `MODEL HEIGHT ${height.toFixed(2)} m`,
    },
  };
  const definition = definitions[axis];
  return (
    <group>
      <Line points={definition.points} color={color} lineWidth={3} />
      {definition.ticks.map((points, index) => <Line key={index} points={points} color={color} lineWidth={3} />)}
      <Text position={definition.labelPosition} rotation={definition.labelRotation} fontSize={0.52} color={color} anchorX="center">
        {definition.label}
      </Text>
    </group>
  );
}

function BridgeModel({ asset, metrics, opacity = 1 }) {
  const { legacy, length, width, spans } = metrics;
  const spanLength = length / spans;
  const superColor = ratingColor(legacy.superstructure_rating ?? asset.OverallConditionRating);
  const subColor = ratingColor(legacy.substructure_rating ?? asset.OverallConditionRating);
  const roadwayColor = ratingColor(legacy.roadway_rating ?? asset.OverallConditionRating);
  const material = (color, extra = {}) => <meshStandardMaterial color={color} roughness={0.68} transparent={opacity < 1} opacity={opacity} {...extra} />;

  return (
    <group>
      <mesh position={[0, 2.35, 0]} castShadow receiveShadow><boxGeometry args={[length, 0.42, width]} />{material(superColor)}</mesh>
      <mesh position={[0, 2.58, 0]} receiveShadow><boxGeometry args={[length, 0.05, width - 0.45]} />{material(roadwayColor, { roughness: 0.95 })}</mesh>
      <mesh position={[0, 2.615, 0]} receiveShadow><boxGeometry args={[length - 0.3, 0.012, 0.09]} />{material('#f8d15a', { emissive: '#705400', emissiveIntensity: 0.35 })}</mesh>
      <Rail z={width / 2 - 0.2} length={length} /><Rail z={-width / 2 + 0.2} length={length} />
      <mesh position={[-length / 2 + 0.35, 1.15, 0]} castShadow receiveShadow><boxGeometry args={[0.8, 2.3, width + 0.8]} />{material(subColor)}</mesh>
      <mesh position={[length / 2 - 0.35, 1.15, 0]} castShadow receiveShadow><boxGeometry args={[0.8, 2.3, width + 0.8]} />{material(subColor)}</mesh>
      {Array.from({ length: spans - 1 }).map((_, index) => {
        const x = -length / 2 + (index + 1) * spanLength;
        return <group key={index} position={[x, 1.12, 0]}><mesh castShadow receiveShadow><cylinderGeometry args={[0.55, 0.8, 2.25, 18]} />{material(subColor)}</mesh><mesh position={[0, 1.02, 0]} castShadow><boxGeometry args={[0.8, 0.25, width - 0.6]} />{material(subColor)}</mesh></group>;
      })}
    </group>
  );
}

function CulvertModel({ asset, metrics, opacity = 1 }) {
  const { legacy, width, spans } = metrics;
  const diameter = Math.min(4, Math.max(1.3, numeric(asset.SpanOrDiameter, legacy.span_diameter, asset.Diameter) || 2));
  const isPipe = String(asset.Type || legacy.type_culvert || '').toLowerCase().includes('pipe');
  const color = ratingColor(legacy.structure_rating ?? asset.OverallConditionRating);
  return (
    <group>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow><boxGeometry args={[Math.max(14, metrics.length), 0.45, width]} /><meshStandardMaterial color="#344866" roughness={0.9} transparent={opacity < 1} opacity={opacity} /></mesh>
      {Array.from({ length: Math.min(6, spans) }).map((_, index) => {
        const x = (index - (Math.min(6, spans) - 1) / 2) * (diameter + 0.55);
        return isPipe ? <mesh key={index} position={[x, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[diameter / 2, diameter / 2, width + 0.2, 28, 1, true]} /><meshStandardMaterial color={color} side={DoubleSide} transparent={opacity < 1} opacity={opacity} /></mesh>
          : <group key={index} position={[x, 1.15, 0]}><mesh castShadow><boxGeometry args={[diameter + 0.45, diameter + 0.45, width + 0.2]} /><meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} /></mesh><mesh><boxGeometry args={[diameter, diameter, width + 0.3]} /><meshStandardMaterial color="#091428" /></mesh></group>;
      })}
    </group>
  );
}

const seedFrom = (value) => String(value || '').split('').reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
const randomFactory = (seedValue) => {
  let seed = seedValue;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
};

function EvidencePointCloud({ asset, metrics, isCulvert }) {
  const geometry = useMemo(() => {
    const positions = [];
    const colors = [];
    const rand = randomFactory(seedFrom(asset.BridgeNumber || asset.CulvertNumber));
    const addCloud = (count, bounds, color) => {
      const shade = new Color(color);
      for (let index = 0; index < count; index += 1) {
        positions.push(bounds.x + (rand() - 0.5) * bounds.w, bounds.y + (rand() - 0.5) * bounds.h, bounds.z + (rand() - 0.5) * bounds.d);
        const variation = 0.78 + rand() * 0.35;
        colors.push(Math.min(1, shade.r * variation), Math.min(1, shade.g * variation), Math.min(1, shade.b * variation));
      }
    };
    addCloud(7000, { x: 0, y: 2.45, z: 0, w: metrics.length, h: 0.55, d: metrics.width }, '#a9b9c9');
    addCloud(1800, { x: -metrics.length / 2, y: 1.15, z: 0, w: 0.9, h: 2.4, d: metrics.width + 0.8 }, '#8c9daf');
    addCloud(1800, { x: metrics.length / 2, y: 1.15, z: 0, w: 0.9, h: 2.4, d: metrics.width + 0.8 }, '#8c9daf');
    if (!isCulvert && metrics.spans > 1) {
      for (let index = 1; index < metrics.spans; index += 1) addCloud(500, { x: -metrics.length / 2 + (index * metrics.length) / metrics.spans, y: 1.1, z: 0, w: 0.9, h: 2.2, d: metrics.width - 0.5 }, '#8497aa');
    }
    addCloud(1800, { x: 0, y: 0.05, z: 0, w: metrics.length * 1.25, h: 0.15, d: metrics.width * 2.5 }, '#3e704f');
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    result.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
    return result;
  }, [asset, isCulvert, metrics]);
  return <points geometry={geometry}><pointsMaterial size={0.07} sizeAttenuation vertexColors transparent opacity={0.9} /></points>;
}

function ActualPointCloud({ url }) {
  const loaded = useLoader(PLYLoader, url);
  const geometry = useMemo(() => {
    const clone = loaded.clone();
    clone.computeBoundingBox();
    clone.center();
    const size = clone.boundingBox?.getSize(new Vector3());
    const maxDimension = Math.max(size?.x || 1, size?.y || 1, size?.z || 1);
    clone.scale(26 / maxDimension, 26 / maxDimension, 26 / maxDimension);
    return clone;
  }, [loaded]);
  return <points geometry={geometry}><pointsMaterial size={0.035} sizeAttenuation vertexColors={Boolean(geometry.getAttribute('color'))} color="#d8e7ff" /></points>;
}

function PhotoPanel({ photo, index, count, radius, opacity }) {
  const texture = useLoader(TextureLoader, getPhotoUrl(photo));
  const angle = (index / count) * Math.PI * 2;
  return (
    <mesh position={[Math.cos(angle) * radius, 5.2, Math.sin(angle) * radius]} rotation={[0, -angle - Math.PI / 2, 0]}>
      <planeGeometry args={[5.2, 3.5]} />
      <meshBasicMaterial map={texture} side={DoubleSide} transparent opacity={opacity} />
    </mesh>
  );
}

function PhotoViewRing({ photos, radius, opacity, limit = 8 }) {
  const views = photos.slice(0, limit);
  return <group>{views.map((photo, index) => <PhotoPanel key={photo.filename} photo={photo} index={index} count={views.length} radius={radius} opacity={opacity} />)}</group>;
}

export default function DigitalTwin({ asset, isCulvert = false, large = false, photos = [], reconstruction = null, mode = 'hybrid', measurement = null }) {
  const metrics = useMemo(() => getMetrics(asset, isCulvert), [asset, isCulvert]);
  if (!asset) return null;
  const actualCloudUrl = reconstruction?.point_cloud_url ? `${BASE_URL}${reconstruction.point_cloud_url}` : null;
  const showStructure = mode === 'constructed' || mode === 'hybrid' || mode === 'photorealism';
  const showCloud = mode === 'reconstructed' || mode === 'hybrid';
  const showPhotos = mode === 'photorealism';
  const measurementValue = measurement === 'length' ? metrics.length : measurement === 'width' ? metrics.width : metrics.height;

  return (
    <div className={`digital-twin-canvas ${large ? 'large' : ''}`} data-testid="digital-twin-canvas">
      <Canvas shadows dpr={[1, 1.6]} camera={{ position: [20, 12, 20], fov: 40 }}>
        <color attach="background" args={['#071126']} /><fog attach="fog" args={['#071126', 38, 78]} />
        <ambientLight intensity={1.2} color="#8fb5ff" /><directionalLight castShadow position={[12, 18, 9]} intensity={3.2} color="#fff2d6" shadow-mapSize={[1024, 1024]} /><pointLight position={[-14, 7, -10]} intensity={30} color="#2b72ff" />
        <group scale={metrics.scale}>
          {showStructure && (isCulvert ? <CulvertModel asset={asset} metrics={metrics} opacity={mode === 'hybrid' ? 0.34 : 1} /> : <BridgeModel asset={asset} metrics={metrics} opacity={mode === 'hybrid' ? 0.34 : 1} />)}
          {showCloud && (actualCloudUrl ? <Suspense fallback={<EvidencePointCloud asset={asset} metrics={metrics} isCulvert={isCulvert} />}><ActualPointCloud url={actualCloudUrl} /></Suspense> : <EvidencePointCloud asset={asset} metrics={metrics} isCulvert={isCulvert} />)}
          <DimensionTicks metrics={metrics} />
          <ActiveMeasurement metrics={metrics} axis={measurement} />
        </group>
        {showPhotos && photos.length > 0 && <Suspense fallback={null}><PhotoViewRing photos={photos} radius={18} opacity={0.94} limit={6} /></Suspense>}
        <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[70, 70]} /><meshStandardMaterial color="#14243d" roughness={0.98} /></mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[13, 70]} /><meshStandardMaterial color="#116891" emissive="#063852" emissiveIntensity={0.55} roughness={0.2} metalness={0.25} /></mesh>
        <ContactShadows position={[0, 0.02, 0]} opacity={0.55} scale={50} blur={2.5} far={14} color="#000611" />
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.28} enableDamping maxPolarAngle={Math.PI / 2 - 0.03} minDistance={11} maxDistance={60} />
      </Canvas>
      <div className="digital-twin-legend">
        <span><i className="good" /> Good</span><span><i className="fair" /> Fair</span><span><i className="poor" /> Poor</span>
      </div>
      <div className="twin-reconstruction-badge">
        <strong>{actualCloudUrl ? 'Registered reconstruction' : 'Evidence-derived cloud preview'}</strong>
        <span>{mode === 'photorealism' ? `${photos.length} canonical photo views` : 'Structural dimensions from BMS inventory'}</span>
      </div>
      {measurement && (
        <div className="twin-measure-result">
          <strong>{measurement === 'height' ? 'Model envelope height' : `Inventory ${measurement}`}</strong>
          <span>{measurementValue.toFixed(2)} m</span>
        </div>
      )}
    </div>
  );
}
