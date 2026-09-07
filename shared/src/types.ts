import {
  UserRole,
  UserStatus,
  VehicleType,
  LuggagePolicy,
  JourneyStatus,
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
  RefundStatus,
  TicketStatus,
  TicketPriority,
  ReportCategory,
  ReportStatus,
  NotificationType,
} from './constants';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  ratingAverage: number;
  ratingCount: number;
  completedRidesCount: number;
  status: UserStatus;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
}

export interface VehicleDTO {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seatCapacity: number;
  vehicleType: VehicleType;
  amenities: string[];
  photoUrl?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WaypointDTO {
  id: string;
  journeyId: string;
  stopOrder: number;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  estimatedTimeOffsetMin: number;
  priceOffset: number;
}

export interface JourneyDTO {
  id: string;
  driverId: string;
  vehicleId: string;
  originName: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  routePolyline?: string | null;
  distanceKm: number;
  estimatedDurationMin: number;
  departureTime: string;
  estimatedArrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  currency: string;
  autoAccept: boolean;
  luggagePolicy: LuggagePolicy;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  musicAllowed: boolean;
  acAvailable: boolean;
  womenOnly: boolean;
  description?: string | null;
  status: JourneyStatus;
  driver?: UserDTO;
  vehicle?: VehicleDTO;
  waypoints?: WaypointDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingDTO {
  id: string;
  journeyId: string;
  passengerId: string;
  seatsBooked: number;
  totalAmount: number;
  currency: string;
  pickupStopId?: string | null;
  dropoffStopId?: string | null;
  status: BookingStatus;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  journey?: JourneyDTO;
  passenger?: UserDTO;
  payment?: PaymentDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDTO {
  id: string;
  bookingId: string;
  payerId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refunds?: RefundDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface RefundDTO {
  id: string;
  paymentId: string;
  amount: number;
  gatewayRefundId?: string | null;
  reason: string;
  status: RefundStatus;
  processedAt?: string | null;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  journeyId?: string | null;
  type: 'JOURNEY_CHAT' | 'DIRECT';
  otherMember?: UserDTO;
  lastMessage?: MessageDTO | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ReviewDTO {
  id: string;
  journeyId: string;
  reviewerId: string;
  reviewedUserId: string;
  roleAs: 'DRIVER_REVIEWING_PASSENGER' | 'PASSENGER_REVIEWING_DRIVER';
  rating: number;
  comment: string;
  categories: {
    punctuality?: number;
    cleanliness?: number;
    driving?: number;
    communication?: number;
  };
  reviewer?: UserDTO;
  createdAt: string;
}

export interface SupportTicketDTO {
  id: string;
  userId: string;
  bookingId?: string | null;
  category: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  user?: UserDTO;
  messages?: SupportMessageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessageDTO {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  message: string;
  isStaffReply: boolean;
  createdAt: string;
}

export interface SafetyReportDTO {
  id: string;
  reporterId: string;
  reportedUserId: string;
  journeyId?: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  adminNotes?: string | null;
  reporter?: UserDTO;
  reportedUser?: UserDTO;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
