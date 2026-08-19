import { getPhotoUrl } from '../utils/photoUrlResolver';

const numericOrder = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const sortedPhotos = (photos) => [...photos].sort((left, right) => (
  numericOrder(left.capture_year) - numericOrder(right.capture_year)
  || numericOrder(left.sequence) - numericOrder(right.sequence)
  || String(left.filename || '').localeCompare(String(right.filename || ''))
));

const viewLabel = (photo, index) => {
  const sequence = Number(photo.sequence);
  const viewNumber = Number.isFinite(sequence) ? sequence : index + 1;
  return `Inspection view ${String(viewNumber).padStart(2, '0')}`;
};

export default function ReportPhotoGrid({ photos = [], structureId, compact = false }) {
  const orderedPhotos = sortedPhotos(photos);

  return (
    <>
      {orderedPhotos.length > 0 && !compact && <div className="bms-hard-page-break" aria-hidden="true" />}
      <section className={`bms-report-photo-register ${orderedPhotos.length ? 'has-photos' : 'is-empty'} ${compact ? 'is-compact' : ''}`}>
      <div className="bms-report-photo-heading">
        <h4>PHOTO EVIDENCE REGISTER</h4>
        <span>{orderedPhotos.length} indexed {orderedPhotos.length === 1 ? 'image' : 'images'}</span>
      </div>

      {orderedPhotos.length > 0 ? (
        <div className="bms-report-photo-grid">
          {orderedPhotos.map((photo, index) => (
            <figure className="bms-report-photo-card" key={`${photo.path || photo.filename}-${index}`}>
              <img src={getPhotoUrl(photo)} alt={`${structureId} ${viewLabel(photo, index)}`} />
              <figcaption>
                <strong>{structureId} - {viewLabel(photo, index)}</strong>
                <span>
                  {photo.capture_year ? `Inspection ${photo.capture_year}` : 'Inspection year not recorded'}
                  {' | '}Photo {index + 1} of {orderedPhotos.length}
                </span>
                <small title={photo.filename}>{photo.filename || 'Source filename unavailable'}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="bms-report-photo-empty">No indexed photographs are available for this structure.</div>
      )}
      </section>
    </>
  );
}
