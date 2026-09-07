import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../src/models/db';
import { authService } from '../../src/services/auth.service';
import { vehicleRepository } from '../../src/repositories/vehicle.repository';
import { journeyService } from '../../src/services/journey.service';
import { journeyRepository } from '../../src/repositories/journey.repository';
import { bookingService } from '../../src/services/booking.service';
import { UserRole, VehicleType, JourneyStatus, BookingStatus } from '@yatrashare/shared';

describe('Atomic Booking & Seat Concurrency Test', () => {
  let driverId: string;
  let passenger1Id: string;
  let passenger2Id: string;
  let vehicleId: string;
  let journeyId: string;

  before(async () => {
    await db.init();

    // 1. Create a Driver
    const driver = await authService.register({
      email: `driver_${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Concurrency Test Driver',
      role: UserRole.DRIVER,
    });
    driverId = driver.user.id;

    // 2. Create Two Passengers
    const p1 = await authService.register({
      email: `p1_${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Passenger Alpha',
      role: UserRole.USER,
    });
    passenger1Id = p1.user.id;

    const p2 = await authService.register({
      email: `p2_${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'Passenger Beta',
      role: UserRole.USER,
    });
    passenger2Id = p2.user.id;

    // 3. Create Vehicle with 4 seats
    vehicleId = uuidv4();
    await vehicleRepository.create({
      id: vehicleId,
      user_id: driverId,
      make: 'Maruti',
      model: 'Swift',
      year: 2022,
      color: 'White',
      license_plate: `KA51${Math.floor(1000 + Math.random() * 9000)}`,
      seat_capacity: 4,
      vehicle_type: VehicleType.HATCHBACK,
      amenities: JSON.stringify(['AC']),
      is_default: 1,
    });

    // 4. Create Journey with ONLY 1 available seat
    const depTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const journey = await journeyService.createJourney(driverId, {
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

  it('should prevent overbooking when two users attempt to book the last seat simultaneously', async () => {
    // Both passengers attempt to book 1 seat at the exact same time
    const results = await Promise.allSettled([
      bookingService.createBooking(passenger1Id, journeyId, 1),
      bookingService.createBooking(passenger2Id, journeyId, 1),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Exactly 1 must succeed and exactly 1 must fail!
    assert.strictEqual(successes.length, 1, 'Exactly one concurrent booking must succeed');
    assert.strictEqual(failures.length, 1, 'The competing concurrent booking must fail');

    // The successful booking must be confirmed
    const winnerBooking: any = (successes[0] as PromiseFulfilledResult<any>).value;
    assert.strictEqual(winnerBooking.status, BookingStatus.CONFIRMED);

    // Verify journey seat inventory in database
    const updatedJourney = await journeyRepository.findById(journeyId);
    assert.ok(updatedJourney);
    assert.strictEqual(updatedJourney.available_seats, 0, 'Available seats must be exactly 0');
    assert.strictEqual(updatedJourney.status, JourneyStatus.FULL, 'Journey status must transition to FULL');
  });
});
