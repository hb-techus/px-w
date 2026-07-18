export const normalizeLabel = (text = '') => {
  const specialCases = {
    door_window: 'Doors & Windows',
    doors: 'Doors & Windows',
    hvac: 'HVAC',
    paint: 'Painting',
  };

  const key = text.toLowerCase();

  // Handle special mappings first
  if (specialCases[key]) return specialCases[key];

  // Default behavior
  return text
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

// Normalizes the takeoff-type prefix of an item name, e.g. "Door_window Item" → "Doors & Windows Item"
export const normalizeItemName = (name = '') =>
  name
    .replace(/^([a-z][a-z0-9]*(?:_[a-z0-9]+)*)/i, match => normalizeLabel(match))
    .replace(/(\s+\d+)-\d+$/, '$1');