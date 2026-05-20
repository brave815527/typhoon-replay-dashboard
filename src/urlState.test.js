import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LAYERS,
  buildQueryString,
  parseQueryState,
  resolveInitialSelection,
} from './urlState.js';

const catalogue = {
  2024: ['GAEMI', 'KONG-REY'],
  2025: ['DANAS', 'PODUL'],
};

test('parses URL query state with layers and station', () => {
  const state = parseQueryState('?year=2024&typhoon=GAEMI&time=1721793600&station=467620&layers=wind,track,r7,rain');

  assert.equal(state.year, '2024');
  assert.equal(state.typhoon, 'GAEMI');
  assert.equal(state.time, '1721793600');
  assert.equal(state.station, '467620');
  assert.deepEqual(state.layers, ['wind', 'track', 'r7', 'rain']);
});

test('resolves valid and invalid query selection against catalogue', () => {
  assert.deepEqual(resolveInitialSelection(catalogue, { year: '2024', typhoon: 'GAEMI' }), {
    year: '2024',
    typhoon: 'GAEMI',
    usedFallback: false,
  });

  assert.deepEqual(resolveInitialSelection(catalogue, { year: '1999', typhoon: 'NOPE' }), {
    year: '2025',
    typhoon: 'DANAS',
    usedFallback: true,
  });
});

test('builds stable query strings and omits default layers', () => {
  assert.equal(buildQueryString({
    year: '2024',
    typhoon: 'GAEMI',
    time: '1721793600',
    station: '467620',
    layers: DEFAULT_LAYERS,
  }), '?year=2024&typhoon=GAEMI&time=1721793600&station=467620');

  assert.equal(buildQueryString({
    year: '2024',
    typhoon: 'GAEMI',
    layers: ['wind', 'rain'],
  }), '?year=2024&typhoon=GAEMI&layers=wind%2Crain');
});
