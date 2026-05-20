import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELD_INDEX,
  getCurrentTyphoonPosition,
  getStationReading,
  getStationType,
  normalizeTyphoonEvent,
  rankStations,
} from './dataAdapter.js';

const sampleEvent = {
  typhoon: {
    name: 'GAEMI',
    track: [
      { epoch: 1000, lat: 20, lon: 120, wind: 20, pressure: 990, r7: -99, r10: -99, warn: 0 },
      { epoch: 2000, lat: 21, lon: 121, wind: 30, pressure: 970, r7: 120, r10: 40, warn: 2 },
    ],
  },
  stations: {
    '466990': { n: 'Hualien', la: 23.97, lo: 121.61, extremes: { wd7v: 42, ps5v: 950, pp1v: 260 } },
    C0A520: { n: 'Auto Station', la: 24.1, lo: 121.2, extremes: { pp1v: 120 } },
    BAD: { n: 'Missing', la: 24.2, lo: 121.3, extremes: {} },
  },
  hourlyData: {
    1000: {
      '466990': [8.5, 180, 20.1, 200, 27.1, 88, 982.5, 12],
      C0A520: [-999, -999, -999, -999, 26, 90, 980, 5],
      BAD: [-999, -999, 999, -999, '', 9999, -999, -999],
    },
    2000: {
      '466990': [18, 190, 42, 210, 25, 99, 950, 28],
    },
  },
};

test('normalizes typhoon event metadata, epochs, track, and station readings', () => {
  const event = normalizeTyphoonEvent(sampleEvent, { year: '2024', typhoon: 'GAEMI' });

  assert.equal(event.metadata.year, '2024');
  assert.equal(event.metadata.name, 'GAEMI');
  assert.equal(event.metadata.localName, '\u51f1\u7c73');
  assert.deepEqual(event.epochs, ['1000', '2000']);
  assert.equal(event.timeRange.startEpoch, 1000);
  assert.equal(event.timeRange.endEpoch, 2000);
  assert.equal(event.track[0].r7, null);
  assert.equal(event.track[1].r10, 40);
  assert.equal(event.stations['466990'].type, 'manual');
  assert.equal(event.stations.C0A520.type, 'automatic');
});

test('maps raw station arrays into named fields and filters missing values', () => {
  const reading = getStationReading(sampleEvent.hourlyData[1000]['466990']);
  const missing = getStationReading(sampleEvent.hourlyData[1000].BAD);

  assert.equal(FIELD_INDEX.windAvg, 0);
  assert.equal(reading.windAvg, 8.5);
  assert.equal(reading.gustDir, 200);
  assert.equal(reading.pressure, 982.5);
  assert.equal(missing.windAvg, null);
  assert.equal(missing.gust, null);
  assert.equal(missing.humidity, null);
});

test('ranks stations by average wind, gust, rain, and pressure with type filters', () => {
  const event = normalizeTyphoonEvent(sampleEvent, { year: '2024', typhoon: 'GAEMI' });

  assert.equal(rankStations(event, '1000', 'avgWind')[0].stationId, '466990');
  assert.equal(rankStations(event, '2000', 'gust')[0].value, 42);
  assert.equal(rankStations(event, '1000', 'rain')[0].unit, 'mm');
  assert.equal(rankStations(event, '1000', 'pressure')[0].sortValue, -980);
  assert.equal(rankStations(event, '1000', 'avgWind', { stationType: 'automatic' }).length, 0);
});

test('selects the latest track point at or before the current epoch', () => {
  const event = normalizeTyphoonEvent(sampleEvent, { year: '2024', typhoon: 'GAEMI' });

  assert.equal(getCurrentTyphoonPosition(event.track, 1500).epoch, 1000);
  assert.equal(getCurrentTyphoonPosition(event.track, 2500).epoch, 2000);
  assert.equal(getStationType('466990'), 'manual');
  assert.equal(getStationType('C0A520'), 'automatic');
});
