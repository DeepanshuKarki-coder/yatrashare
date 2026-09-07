import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { hashPassword } from '../utils/crypto';
import {
  UserRole,
  UserStatus,
  VehicleType,
  JourneyStatus,
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
  TicketStatus,
  TicketPriority,
  ReportCategory,
  ReportStatus,
  NotificationType,
} from '@yatrashare/shared';
import { logger } from '../config/logger';

export async function seedDatabase() {
  logger.info('Starting realistic seed data generation...');
  await db.init();

  // 1. Users
  const defaultPassword = await hashPassword('Password123!');
  const now = new Date().toISOString();

  const users = [
    {
      id: uuidv4(),
      email: 'admin@yatrashare.com',
      password_hash: defaultPassword,
      full_name: 'Super Admin',
      phone: '+919876543210',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Platform Administrator for YatraShare',
      role: UserRole.ADMIN,
      is_email_verified: 1,
      is_phone_verified: 1,
      is_identity_verified: 1,
      rating_average: 5.0,
      rating_count: 0,
      completed_rides_count: 0,
      status: UserStatus.ACTIVE,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      email: 'support@yatrashare.com',
      password_hash: defaultPassword,
      full_name: 'Ananya Support',
      phone: '+919876543211',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      bio: 'Dedicated 24/7 Community Support Specialist',
      role: UserRole.SUPPORT,
      is_email_verified: 1,
      is_phone_verified: 1,
      is_identity_verified: 1,
      rating_average: 5.0,
      rating_count: 0,
      completed_rides_count: 0,
      status: UserStatus.ACTIVE,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      email: 'vikram.singh@example.com',
      password_hash: defaultPassword,
      full_name: 'Vikram Singh',
      phone: '+919811223344',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Experienced tech lead and verified driver. Frequent weekend trips between Bengaluru and Mysuru. Calm music, safe driving.',
      role: UserRole.DRIVER,
      is_email_verified: 1,
      is_phone_verified: 1,
      is_identity_verified: 1,
      rating_average: 4.9,
      rating_count: 34,
      completed_rides_count: 48,
      status: UserStatus.ACTIVE,
      emergency_contact_name: 'Rajesh Singh',
      emergency_contact_phone: '+919811223300',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      email: 'priya.sharma@example.com',
      password_hash: defaultPassword,
      full_name: 'Priya Sharma',
      phone: '+919822334455',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      bio: 'Architect commuting between Pune and Mumbai. Driving electric vehicle with clean amenities. Women-friendly ride host.',
      role: UserRole.DRIVER,
      is_email_verified: 1,
      is_phone_verified: 1,
      is_identity_verified: 1,
      rating_average: 4.85,
      rating_count: 22,
      completed_rides_count: 31,
      status: UserStatus.ACTIVE,
      emergency_contact_name: 'Meera Sharma',
      emergency_contact_phone: '+919822334400',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      email: 'arjun.patel@example.com',
      password_hash: defaultPassword,
      full_name: 'Arjun Patel',
      phone: '+919833445566',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      bio: 'Consultant & avid traveler. Punctual passenger, respectful co-traveler.',
      role: UserRole.USER,
      is_email_verified: 1,
      is_phone_verified: 1,
      is_identity_verified: 1,
      rating_average: 5.0,
      rating_count: 14,
      completed_rides_count: 16,
      status: UserStatus.ACTIVE,
      emergency_contact_name: 'Kavita Patel',
      emergency_contact_phone: '+919833445500',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      email: 'neha.verma@example.com',
      password_hash: defaultPassword,
      full_name: 'Neha Verma',
      phone: '+919844556677',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      bio: 'Student at Pune University. Regular weekend commuter.',
      role: UserRole.USER,
      is_email_verified: 1,
      is_phone_verified: 0,
      is_identity_verified: 1,
      rating_average: 4.8,
      rating_count: 8,
      completed_rides_count: 9,
      status: UserStatus.ACTIVE,
      created_at: now,
      updated_at: now,
    },
  ];

  for (const u of users) {
    const existing = await db.queryOne('SELECT id FROM users WHERE email = $1', [u.email]);
    if (!existing) {
      await db.execute(
        `INSERT INTO users (
          id, email, password_hash, full_name, phone, avatar_url, bio, role,
          is_email_verified, is_phone_verified, is_identity_verified,
          rating_average, rating_count, completed_rides_count, status,
          emergency_contact_name, emergency_contact_phone, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          u.id, u.email, u.password_hash, u.full_name, u.phone, u.avatar_url, u.bio, u.role,
          u.is_email_verified, u.is_phone_verified, u.is_identity_verified,
          u.rating_average, u.rating_count, u.completed_rides_count, u.status,
          u.emergency_contact_name || null, u.emergency_contact_phone || null, u.created_at, u.updated_at
        ]
      );
    }
  }

  const vikram = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', ['vikram.singh@example.com']);
  const priya = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', ['priya.sharma@example.com']);
  const arjun = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', ['arjun.patel@example.com']);
  const neha = await db.queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', ['neha.verma@example.com']);

  if (!vikram || !priya || !arjun || !neha) return;

  // 2. Vehicles
  const vehicle1Id = uuidv4();
  const vehicle2Id = uuidv4();

  const existingVehicle = await db.queryOne('SELECT id FROM vehicles WHERE user_id = $1', [vikram.id]);
  if (!existingVehicle) {
    await db.execute(
      `INSERT INTO vehicles (id, user_id, make, model, year, color, license_plate, seat_capacity, vehicle_type, amenities, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        vehicle1Id, vikram.id, 'Honda', 'City ZX', 2022, 'Meteoroid Grey', 'KA01MJ4321', 4,
        VehicleType.SEDAN, JSON.stringify(['AC', 'WIFI', 'USB_CHARGER', 'EXTRA_LUGGAGE']), 1, now, now
      ]
    );

    await db.execute(
      `INSERT INTO vehicles (id, user_id, make, model, year, color, license_plate, seat_capacity, vehicle_type, amenities, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        vehicle2Id, priya.id, 'Tata', 'Nexon EV Prime', 2023, 'Intense Teal', 'MH12CD5678', 4,
        VehicleType.EV, JSON.stringify(['AC', 'USB_CHARGER', 'CLEAN_AIR']), 1, now, now
      ]
    );
  }

  // 3. Journeys
  const journey1Id = uuidv4();
  const journey2Id = uuidv4();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(7, 30, 0, 0);

  const tomorrowArrival = new Date(tomorrow);
  tomorrowArrival.setHours(11, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(17, 0, 0, 0);

  const dayAfterArrival = new Date(dayAfter);
  dayAfterArrival.setHours(20, 30, 0, 0);

  const existingJourney = await db.queryOne('SELECT id FROM journeys WHERE driver_id = $1', [vikram.id]);
  if (!existingJourney) {
    // Journey 1: Bengaluru to Mysuru
    await db.execute(
      `INSERT INTO journeys (
        id, driver_id, vehicle_id, origin_name, origin_address, origin_lat, origin_lng,
        destination_name, destination_address, destination_lat, destination_lng,
        distance_km, estimated_duration_min, departure_time, estimated_arrival_time,
        total_seats, available_seats, price_per_seat, currency, auto_accept,
        luggage_policy, smoking_allowed, pets_allowed, music_allowed, ac_available, women_only,
        description, status, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`,
      [
        journey1Id, vikram.id, vehicle1Id,
        'Bengaluru (Koramangala Sony Signal)', 'Sony World Junction, 80 Feet Rd, Koramangala, Bengaluru, Karnataka 560034',
        12.9352, 77.6245,
        'Mysuru (Suburban Bus Stand)', 'Bangalore Nilgiri Rd, Lashkar Mohalla, Mandi Mohalla, Mysuru, Karnataka 570001',
        12.3118, 76.6569,
        145.5, 210, tomorrow.toISOString(), tomorrowArrival.toISOString(),
        3, 2, 350.0, 'INR', 1,
        'MEDIUM', 0, 0, 1, 1, 0,
        'Driving on the Bengaluru-Mysuru Expressway. One 15-minute coffee stop at Maddur Tiffany. Drop-off near Suburban Bus Stand or Highway exit.',
        JourneyStatus.PUBLISHED, 1, now, now
      ]
    );

    // Waypoints for Journey 1
    const wp1Id = uuidv4();
    await db.execute(
      `INSERT INTO journey_waypoints (id, journey_id, stop_order, place_name, address, lat, lng, estimated_time_offset_min, price_offset)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [wp1Id, journey1Id, 1, 'Kengeri Metro Station', 'Mysore Rd, Kengeri Satellite Town, Bengaluru', 12.9081, 77.4784, 45, 0]
    );

    // Journey 2: Pune to Mumbai (Women Only, Electric)
    await db.execute(
      `INSERT INTO journeys (
        id, driver_id, vehicle_id, origin_name, origin_address, origin_lat, origin_lng,
        destination_name, destination_address, destination_lat, destination_lng,
        distance_km, estimated_duration_min, departure_time, estimated_arrival_time,
        total_seats, available_seats, price_per_seat, currency, auto_accept,
        luggage_policy, smoking_allowed, pets_allowed, music_allowed, ac_available, women_only,
        description, status, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`,
      [
        journey2Id, priya.id, vehicle2Id,
        'Pune (Wakad Flyover)', 'Wakad, Pimpri-Chinchwad, Pune, Maharashtra 411057',
        18.5987, 73.7660,
        'Mumbai (Dadar TT Circle)', 'Dadar East, Dadar, Mumbai, Maharashtra 400014',
        19.0178, 72.8478,
        148.0, 210, dayAfter.toISOString(), dayAfterArrival.toISOString(),
        3, 3, 420.0, 'INR', 1,
        'SMALL', 0, 0, 1, 1, 1,
        'Comfortable EV journey via Mumbai-Pune Expressway. AC on throughout. Women travelers only for mutual comfort and safety.',
        JourneyStatus.PUBLISHED, 1, now, now
      ]
    );

    // 4. Booking for Arjun on Journey 1
    const booking1Id = uuidv4();
    await db.execute(
      `INSERT INTO bookings (id, journey_id, passenger_id, seats_booked, total_amount, currency, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [booking1Id, journey1Id, arjun.id, 1, 350.0, 'INR', BookingStatus.CONFIRMED, now, now]
    );

    // Payment for Booking 1
    const payment1Id = uuidv4();
    await db.execute(
      `INSERT INTO payments (id, booking_id, payer_id, gateway, gateway_order_id, gateway_payment_id, gateway_signature, amount, currency, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [payment1Id, booking1Id, arjun.id, PaymentGateway.MOCK, `order_mock_${Date.now()}`, `pay_mock_${Date.now()}`, 'mock_signature_verified', 350.0, 'INR', PaymentStatus.CAPTURED, now, now]
    );

    // Notification for Arjun
    await db.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(), arjun.id, NotificationType.BOOKING_CONFIRMED,
        'Booking Confirmed!', 'Your seat with Vikram Singh from Bengaluru to Mysuru is confirmed. Have a safe journey!',
        JSON.stringify({ bookingId: booking1Id, journeyId: journey1Id }), 0, now
      ]
    );

    // 5. Sample Past Journey with completed review
    const pastJourneyId = uuidv4();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastArrival = new Date(pastDate);
    pastArrival.setHours(pastArrival.getHours() + 3);

    await db.execute(
      `INSERT INTO journeys (
        id, driver_id, vehicle_id, origin_name, origin_address, origin_lat, origin_lng,
        destination_name, destination_address, destination_lat, destination_lng,
        distance_km, estimated_duration_min, departure_time, estimated_arrival_time,
        total_seats, available_seats, price_per_seat, currency, auto_accept,
        luggage_policy, smoking_allowed, pets_allowed, music_allowed, ac_available, women_only,
        description, status, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`,
      [
        pastJourneyId, vikram.id, vehicle1Id,
        'Bengaluru (Indiranagar)', '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038', 12.9719, 77.6412,
        'Chennai (Guindy)', 'Kathipara Junction, Guindy, Chennai, Tamil Nadu 600032', 13.0067, 80.2024,
        340.0, 360, pastDate.toISOString(), pastArrival.toISOString(),
        3, 0, 850.0, 'INR', 1,
        'MEDIUM', 0, 0, 1, 1, 0,
        'Smooth drive along NH48. Good roads, comfortable ride.',
        JourneyStatus.COMPLETED, 1, pastDate.toISOString(), pastArrival.toISOString()
      ]
    );

    // Review from Arjun for Vikram on past journey
    await db.execute(
      `INSERT INTO reviews (id, journey_id, reviewer_id, reviewed_user_id, role_as, rating, comment, categories, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuidv4(), pastJourneyId, arjun.id, vikram.id, 'PASSENGER_REVIEWING_DRIVER', 5,
        'Vikram is an outstanding driver. Highly punctual, courteous, car was immaculate, and drove very smoothly on the expressway. 10/10 recommended!',
        JSON.stringify({ punctuality: 5, cleanliness: 5, driving: 5, communication: 5 }),
        pastArrival.toISOString()
      ]
    );

    // 6. Support Ticket
    const ticketId = uuidv4();
    await db.execute(
      `INSERT INTO support_tickets (id, user_id, booking_id, category, subject, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [ticketId, neha.id, null, 'Payment Inquiry', 'Question regarding UPI refund timeframe', TicketPriority.MEDIUM, TicketStatus.OPEN, now, now]
    );

    await db.execute(
      `INSERT INTO support_messages (id, ticket_id, sender_id, message, is_staff_reply, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), ticketId, neha.id, 'Hello team, if I cancel a ride 2 days in advance, how long does the UPI refund take to credit back to my Google Pay?', 0, now]
    );
  }

  logger.info('Database seeded successfully with realistic drivers, passengers, vehicles, journeys, and reviews!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Failed to seed database', err);
      process.exit(1);
    });
}
