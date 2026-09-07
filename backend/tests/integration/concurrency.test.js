"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const uuid_1 = require("uuid");
const db_1 = require("../../src/models/db");
const auth_service_1 = require("../../src/services/auth.service");
const vehicle_repository_1 = require("../../src/repositories/vehicle.repository");
const journey_service_1 = require("../../src/services/journey.service");
const journey_repository_1 = require("../../src/repositories/journey.repository");
const booking_service_1 = require("../../src/services/booking.service");
const shared_1 = require("@yatrashare/shared");
(0, node_test_1.describe)('Atomic Booking & Seat Concurrency Test', () => {
    let driverId;
    let passenger1Id;
    let passenger2Id;
    let vehicleId;
    let journeyId;
    (0, node_test_1.before)(async () => {
        await db_1.db.init();
        // 1. Create a Driver
        const driver = await auth_service_1.authService.register({
            email: `driver_${Date.now()}@example.com`,
            password: 'Password123!',
            fullName: 'Concurrency Test Driver',
            role: shared_1.UserRole.DRIVER,
        });
        driverId = driver.user.id;
        // 2. Create Two Passengers
        const p1 = await auth_service_1.authService.register({
            email: `p1_${Date.now()}@example.com`,
            password: 'Password123!',
            fullName: 'Passenger Alpha',
            role: shared_1.UserRole.USER,
        });
        passenger1Id = p1.user.id;
        const p2 = await auth_service_1.authService.register({
            email: `p2_${Date.now()}@example.com`,
            password: 'Password123!',
            fullName: 'Passenger Beta',
            role: shared_1.UserRole.USER,
        });
        passenger2Id = p2.user.id;
        // 3. Create Vehicle with 4 seats
        vehicleId = (0, uuid_1.v4)();
        await vehicle_repository_1.vehicleRepository.create({
            id: vehicleId,
            user_id: driverId,
            make: 'Maruti',
            model: 'Swift',
            year: 2022,
            color: 'White',
            license_plate: `KA51${Math.floor(1000 + Math.random() * 9000)}`,
            seat_capacity: 4,
            vehicle_type: shared_1.VehicleType.HATCHBACK,
            amenities: JSON.stringify(['AC']),
            is_default: 1,
        });
        // 4. Create Journey with ONLY 1 available seat
        const depTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const journey = await journey_service_1.journeyService.createJourney(driverId, {
            vehicleId,
            originName: 'Bengaluru Silk Board',
            originAddress: 'Hosur Rd, Silk Board, Bengaluru',
            originLat: 12.9176,
            originLng: 77.6234,
            destinationName: 'Electronic City Phase 1',
            destinationAddress: 'Electronic City, Bengaluru',
            destinationLat: 12.8452,
            destinationLng: 77.6602,
            distanceKm: 12.0,
            estimatedDurationMin: 30,
            departureTime: depTime,
            totalSeats: 1, // Only 1 seat offered!
            pricePerSeat: 80,
            autoAccept: true,
        });
        journeyId = journey.id;
    });
    (0, node_test_1.it)('should prevent overbooking when two users attempt to book the last seat simultaneously', async () => {
        // Both passengers attempt to book 1 seat at the exact same time
        const results = await Promise.allSettled([
            booking_service_1.bookingService.createBooking(passenger1Id, journeyId, 1),
            booking_service_1.bookingService.createBooking(passenger2Id, journeyId, 1),
        ]);
        const successes = results.filter((r) => r.status === 'fulfilled');
        const failures = results.filter((r) => r.status === 'rejected');
        // Exactly 1 must succeed and exactly 1 must fail!
        node_assert_1.default.strictEqual(successes.length, 1, 'Exactly one concurrent booking must succeed');
        node_assert_1.default.strictEqual(failures.length, 1, 'The competing concurrent booking must fail');
        // The successful booking must be confirmed
        const winnerBooking = successes[0].value;
        node_assert_1.default.strictEqual(winnerBooking.status, shared_1.BookingStatus.CONFIRMED);
        // Verify journey seat inventory in database
        const updatedJourney = await journey_repository_1.journeyRepository.findById(journeyId);
        node_assert_1.default.ok(updatedJourney);
        node_assert_1.default.strictEqual(updatedJourney.available_seats, 0, 'Available seats must be exactly 0');
        node_assert_1.default.strictEqual(updatedJourney.status, shared_1.JourneyStatus.FULL, 'Journey status must transition to FULL');
    });
});
