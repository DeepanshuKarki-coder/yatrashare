"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const geo_1 = require("../../src/utils/geo");
(0, node_test_1.describe)('Geospatial Utilities', () => {
    (0, node_test_1.it)('should calculate accurate distance between Bengaluru and Mysuru', () => {
        // Bengaluru (12.9716, 77.5946) to Mysuru (12.2958, 76.6394) is ~128-140 km air distance
        const dist = (0, geo_1.calculateHaversineDistanceKm)(12.9716, 77.5946, 12.2958, 76.6394);
        node_assert_1.default.ok(dist > 125 && dist < 145, `Distance was ${dist} km, expected between 125 and 145 km`);
    });
    (0, node_test_1.it)('should return 0 km for identical coordinates', () => {
        const dist = (0, geo_1.calculateHaversineDistanceKm)(19.0760, 72.8777, 19.0760, 72.8777);
        node_assert_1.default.strictEqual(dist, 0);
    });
    (0, node_test_1.it)('should compute bounding boxes properly', () => {
        const box = (0, geo_1.getBoundingBox)(12.9716, 77.5946, 25);
        node_assert_1.default.ok(box.minLat < 12.9716);
        node_assert_1.default.ok(box.maxLat > 12.9716);
        node_assert_1.default.ok(box.minLng < 77.5946);
        node_assert_1.default.ok(box.maxLng > 77.5946);
    });
    (0, node_test_1.it)('should estimate duration based on highway speed and buffers', () => {
        const duration = (0, geo_1.estimateDurationMinutes)(120); // 120 km at 60 km/h = 120 mins + 15 buffer = 135 mins
        node_assert_1.default.strictEqual(duration, 135);
    });
});
