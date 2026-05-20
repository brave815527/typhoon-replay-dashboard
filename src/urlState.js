export const DEFAULT_LAYERS = ['wind', 'track', 'r7', 'r10'];
export const ALL_LAYERS = ['wind', 'track', 'r7', 'r10', 'rain'];

export function parseQueryState(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const layers = params.get('layers')
    ? params.get('layers').split(',').map((layer) => layer.trim()).filter(Boolean)
    : DEFAULT_LAYERS;

  return {
    year: params.get('year') || '',
    typhoon: params.get('typhoon') || '',
    time: params.get('time') || params.get('t') || '',
    station: params.get('station') || '',
    layers: layers.filter((layer) => ALL_LAYERS.includes(layer)),
  };
}

export function resolveInitialSelection(catalogue, queryState = {}) {
  const years = Object.keys(catalogue || {}).sort().reverse();
  const fallbackYear = years[0] || '';
  const fallbackTyphoon = fallbackYear ? catalogue[fallbackYear]?.[0] || '' : '';
  const yearIsValid = queryState.year && catalogue?.[queryState.year];
  const typhoonIsValid = yearIsValid && catalogue[queryState.year].includes(queryState.typhoon);

  if (yearIsValid && typhoonIsValid) {
    return { year: queryState.year, typhoon: queryState.typhoon, usedFallback: false };
  }

  return { year: fallbackYear, typhoon: fallbackTyphoon, usedFallback: Boolean(queryState.year || queryState.typhoon) };
}

export function buildQueryString({ year, typhoon, time, station, layers = DEFAULT_LAYERS }) {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (typhoon) params.set('typhoon', typhoon);
  if (time) params.set('time', String(time));
  if (station) params.set('station', station);
  const normalizedLayers = layers.filter((layer) => ALL_LAYERS.includes(layer));
  if (normalizedLayers.join(',') !== DEFAULT_LAYERS.join(',')) {
    params.set('layers', normalizedLayers.join(','));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function nearestEpochIndex(epochs = [], requestedTime) {
  if (!epochs.length || !requestedTime) return 0;
  const target = Number(requestedTime);
  if (!Number.isFinite(target)) return 0;
  let bestIndex = 0;
  let bestDelta = Infinity;
  epochs.forEach((epoch, index) => {
    const delta = Math.abs(Number(epoch) - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = index;
    }
  });
  return bestIndex;
}
