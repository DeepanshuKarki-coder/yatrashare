import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateHaversineDistanceKm, getBoundingBox, estimateDurationMinutes } from '../../src/utils/geo';

describe('Geospatial Utilities', () => {
  it('should calculate accurate distance between Bengaluru and Mysuru', () => {
    // Bengaluru (12.9716, 77.5946) to Mysuru (12.2958, 76.6394) is ~128-140 km air distance
    const dist = calculateHaversineDistanceKm(12.9716, 77.5946, 12.2958, 76.6394);
    assert.ok(dist > 125 && dist < 145, `Distance was ${dist} km, expected between 125 and 145 km`);
  });

  it('should return 0 km for identical coordinates', () => {
    const dist = calculateHaversineDistanceKm(19.0760, 72.8777, 19.0760, 72.8777);
    assert.strictEqual(dist, 0);
  });

  it('should compute bounding boxes properly', () => {
    const box = getBoundingBox(12.9716, 77.5946, 25);
    assert.ok(box.minLat < 12.9716);
    assert.ok(box.maxLat > 12.9716);
    assert.ok(box.minLng < 77.5946);
    assert.ok(box.maxLng > 77.5946);
  });

  it('should estimate duration based on highway speed and buffers', () => {
    const duration = estimateDurationMinutes(120); // 120 km at 60 km/h = 120 mins + 15 buffer = 135 mins
    assert.strictEqual(duration, 135);
  });
});
