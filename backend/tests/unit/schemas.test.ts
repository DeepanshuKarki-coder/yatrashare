import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  registerSchema,
  loginSchema,
  createJourneySchema,
  createBookingSchema,
  VehicleType,
  LuggagePolicy,
} from '@yatrashare/shared';

describe('Validation Schemas', () => {
  it('should accept valid registration data and reject weak passwords', () => {
    const valid = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'StrongPassword123!',
      fullName: 'Rahul Dravid',
      phone: '+919876543210',
    });
    assert.strictEqual(valid.success, true);

    const weakPassword = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'weak',
      fullName: 'Rahul Dravid',
    });
    assert.strictEqual(weakPassword.success, false);
  });

  it('should validate journey creation parameters', () => {
    const validJourney = createJourneySchema.safeParse({
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
      luggagePolicy: LuggagePolicy.MEDIUM,
      smokingAllowed: false,
      petsAllowed: false,
      musicAllowed: true,
      acAvailable: true,
      womenOnly: false,
    });
    assert.strictEqual(validJourney.success, true);
  });

  it('should validate booking request schema', () => {
    const validBooking = createBookingSchema.safeParse({
      journeyId: '123e4567-e89b-12d3-a456-426614174000',
      seatsBooked: 2,
    });
    assert.strictEqual(validBooking.success, true);

    const invalidSeats = createBookingSchema.safeParse({
      journeyId: '123e4567-e89b-12d3-a456-426614174000',
      seatsBooked: 0,
    });
    assert.strictEqual(invalidSeats.success, false);
  });
});
