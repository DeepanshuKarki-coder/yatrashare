import { z } from 'zod';
import {
  UserRole,
  VehicleType,
  LuggagePolicy,
  JourneyStatus,
  BookingStatus,
  PaymentGateway,
  TicketPriority,
  TicketStatus,
  ReportCategory,
  ReportStatus,
} from './constants';

// --- Auth Schemas ---
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').min(5).max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(60),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').optional(),
  role: z.enum([UserRole.USER, UserRole.DRIVER]).default(UserRole.USER),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(60).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  emergencyContactName: z.string().max(60).optional().nullable(),
  emergencyContactPhone: z.string().regex(/^\+?[0-9]{10,15}$/).optional().nullable(),
});

// --- Vehicle Schemas ---
export const createVehicleSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  color: z.string().min(2).max(30),
  licensePlate: z.string().min(4).max(20),
  seatCapacity: z.number().int().min(1).max(8),
  vehicleType: z.nativeEnum(VehicleType),
  amenities: z.array(z.string()).default([]),
  photoUrl: z.string().url().optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// --- Journey Schemas ---
export const waypointInputSchema = z.object({
  placeName: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  estimatedTimeOffsetMin: z.number().int().min(1),
  priceOffset: z.number().min(0).default(0),
});

export const createJourneySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  originName: z.string().min(1),
  originAddress: z.string().min(1),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destinationName: z.string().min(1),
  destinationAddress: z.string().min(1),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  routePolyline: z.string().optional().nullable(),
  distanceKm: z.number().positive(),
  estimatedDurationMin: z.number().int().positive(),
  departureTime: z.string().datetime('Invalid ISO departure time'),
  totalSeats: z.number().int().min(1).max(7),
  pricePerSeat: z.number().positive(),
  currency: z.string().default('INR'),
  autoAccept: z.boolean().default(true),
  luggagePolicy: z.nativeEnum(LuggagePolicy).default(LuggagePolicy.MEDIUM),
  smokingAllowed: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  musicAllowed: z.boolean().default(true),
  acAvailable: z.boolean().default(true),
  womenOnly: z.boolean().default(false),
  description: z.string().max(1000).optional().nullable(),
  waypoints: z.array(waypointInputSchema).optional().default([]),
});

export const searchJourneySchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  originLat: z.coerce.number().min(-90).max(90).optional(),
  originLng: z.coerce.number().min(-180).max(180).optional(),
  destinationLat: z.coerce.number().min(-90).max(90).optional(),
  destinationLng: z.coerce.number().min(-180).max(180).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  seats: z.coerce.number().int().min(1).default(1),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  acAvailable: z.coerce.boolean().optional(),
  womenOnly: z.coerce.boolean().optional(),
  smokingAllowed: z.coerce.boolean().optional(),
  petsAllowed: z.coerce.boolean().optional(),
  sortBy: z.enum(['departureTime', 'price', 'duration', 'rating']).default('departureTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// --- Booking Schemas ---
export const createBookingSchema = z.object({
  journeyId: z.string().uuid('Invalid journey ID'),
  seatsBooked: z.number().int().min(1).max(6),
  pickupStopId: z.string().uuid().optional().nullable(),
  dropoffStopId: z.string().uuid().optional().nullable(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, 'Please provide a cancellation reason').max(300),
});

// --- Payment Schemas ---
export const createPaymentOrderSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  gateway: z.nativeEnum(PaymentGateway).default(PaymentGateway.MOCK),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  gatewayOrderId: z.string().min(1),
  gatewayPaymentId: z.string().min(1),
  gatewaySignature: z.string().optional(),
});

// --- Review Schemas ---
export const createReviewSchema = z.object({
  journeyId: z.string().uuid('Invalid journey ID'),
  reviewedUserId: z.string().uuid('Invalid reviewed user ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
  categories: z
    .object({
      punctuality: z.number().min(1).max(5).optional(),
      cleanliness: z.number().min(1).max(5).optional(),
      driving: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
    })
    .optional()
    .default({}),
});

// --- Support & Safety Schemas ---
export const createTicketSchema = z.object({
  bookingId: z.string().uuid().optional().nullable(),
  category: z.string().min(2).max(50),
  subject: z.string().min(5).max(100),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  message: z.string().min(10).max(2000),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const createReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  journeyId: z.string().uuid().optional().nullable(),
  category: z.nativeEnum(ReportCategory),
  description: z.string().min(10).max(1000),
});

// --- Message Schema ---
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});
