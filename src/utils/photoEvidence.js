export const structureType = (id) => {
  if (!id) return 'Unassigned';
  if (String(id).toUpperCase().startsWith('B')) return 'Bridge';
  if (String(id).toUpperCase().startsWith('C')) return 'Culvert';
  return 'Other';
};

export const photoYear = (photo) => {
  if (photo.capture_year) return Number(photo.capture_year);
  const match = String(photo.filename || '').match(/(?:^|[_-])(\d{2})(?:[_-])/);
  const year = match ? Number(match[1]) : null;
  return year >= 5 && year <= 26 ? 2000 + year : null;
};

export const groupEvidenceByYear = (photos = []) => {
  const groups = new Map();
  photos.forEach((photo) => {
    const year = photoYear(photo);
    const key = year || 'Undated';
    const group = groups.get(key) || [];
    group.push(photo);
    groups.set(key, group);
  });

  return [...groups.entries()]
    .map(([year, items]) => ({
      year,
      photos: items.sort((a, b) => (
        (Number(a.sequence) || 9999) - (Number(b.sequence) || 9999)
        || String(a.filename).localeCompare(String(b.filename))
      )),
    }))
    .sort((a, b) => {
      if (a.year === 'Undated') return 1;
      if (b.year === 'Undated') return -1;
      return Number(b.year) - Number(a.year);
    });
};
