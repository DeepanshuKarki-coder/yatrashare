"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const shared_1 = require("@yatrashare/shared");
(0, node_test_1.describe)('Validation Schemas', () => {
    (0, node_test_1.it)('should accept valid registration data and reject weak passwords', () => {
        const valid = shared_1.registerSchema.safeParse({
            email: 'test@example.com',
            password: 'StrongPassword123!',
            fullName: 'Rahul Dravid',
            phone: '+919876543210',
        });
        node_assert_1.default.strictEqual(valid.success, true);
        const weakPassword = shared_1.registerSchema.safeParse({
            email: 'test@example.com',
            password: 'weak',
            fullName: 'Rahul Dravid',
        });
        node_assert_1.default.strictEqual(weakPassword.success, false);
    });
    (0, node_test_1.it)('should validate journey creation parameters', () => {
        const validJourney = shared_1.createJourneySchema.safeParse({
            vehicleId: '123e4567-e89b-12d3-a456-426614174000',
            originName: 'Bengaluru',
            originAddress: 'Indiranagar, Bengaluru',
            originLat: 12.9716,
            originLng: 77.5946,
            destinationName: 'Mysuru',
            destinationAddress: 'Mysuru Palace',
            destinationLat: 12.2958,
            destinationLng: 76.6394,
            distanceKm: 140,
            estimatedDurationMin: 180,
            departureTime: new Date(Date.now() + 3600000).toISOString(),
            totalSeats: 3,
            pricePerSeat: 400,
            luggagePolicy: shared_1.LuggagePolicy.MEDIUM,
            smokingAllowed: false,
            petsAllowed: false,
            musicAllowed: true,
            acAvailable: true,
            womenOnly: false,
        });
        node_assert_1.default.strictEqual(validJourney.success, true);
    });
    (0, node_test_1.it)('should validate booking request schema', () => {
        const validBooking = shared_1.createBookingSchema.safeParse({
            journeyId: '123e4567-e89b-12d3-a456-426614174000',
            seatsBooked: 2,
        });
        node_assert_1.default.strictEqual(validBooking.success, true);
        const invalidSeats = shared_1.createBookingSchema.safeParse({
            journeyId: '123e4567-e89b-12d3-a456-426614174000',
            seatsBooked: 0,
        });
        node_assert_1.default.strictEqual(invalidSeats.success, false);
    });
});
