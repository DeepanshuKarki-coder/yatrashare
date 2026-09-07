import { v4 as uuidv4 } from 'uuid';
import { journeyRepository, JourneyRecord, WaypointRecord } from '../repositories/journey.repository';
import { vehicleRepository } from '../repositories/vehicle.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { userRepository } from '../repositories/user.repository';
import { mapsService } from './maps/maps.service';
import { notificationService } from './notification/notification.service';
import { messagingRepository } from '../repositories/messaging.repository';
import { bookingService } from './booking.service';
import { JourneyStatus, UserRole, BookingStatus } from '@yatrashare/shared';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../config/logger';

export class JourneyService {
  async createJourney(driverId: string, data: any) {
    // 1. Verify vehicle belongs to this driver
    const vehicle = await vehicleRepository.findById(data.vehicleId);
    if (!vehicle || vehicle.user_id !== driverId) {
      throw new BadRequestError('Vehicle not found or does not belong to you');
    }

    if (data.totalSeats > vehicle.seat_capacity - 1) {
      throw new BadRequestError(`Cannot offer more seats than vehicle passenger capacity (${vehicle.seat_capacity - 1})`);
    }

    const departure = new Date(data.departureTime).getTime();
    if (departure <= Date.now() + 30 * 60 * 1000) {
      throw new BadRequestError('Departure time must be at least 30 minutes in the future');
    }

    // 2. Check route info if distance or polyline missing
    let distanceKm = data.distanceKm;
    let durationMin = data.estimatedDurationMin;
    let polyline = data.routePolyline;

    if (!distanceKm || !durationMin) {
      const route = await mapsService.calculateRoute(
        { lat: data.originLat, lng: data.originLng },
        { lat: data.destinationLat, lng: data.destinationLng }
      );
      distanceKm = route.distanceKm;
      durationMin = route.durationMinutes;
      polyline = route.polyline;
    }

    const arrivalDate = new Date(departure + durationMin * 60 * 1000);

    const journeyId = uuidv4();
    const waypoints = (data.waypoints || []).map((wp: any, idx: number) => ({
      id: uuidv4(),
      stop_order: idx + 1,
      place_name: wp.placeName,
      address: wp.address,
      lat: wp.lat,
      lng: wp.lng,
      estimated_time_offset_min: wp.estimatedTimeOffsetMin,
      price_offset: wp.priceOffset || 0,
    }));

    const journey = await journeyRepository.create(
      {
        id: journeyId,
        driver_id: driverId,
        vehicle_id: data.vehicleId,
        origin_name: data.originName,
        origin_address: data.originAddress,
        origin_lat: data.originLat,
        origin_lng: data.originLng,
        destination_name: data.destinationName,
        destination_address: data.destinationAddress,
        destination_lat: data.destinationLat,
        destination_lng: data.destinationLng,
        route_polyline: polyline,
        distance_km: distanceKm,
        estimated_duration_min: durationMin,
        departure_time: new Date(departure).toISOString(),
        estimated_arrival_time: arrivalDate.toISOString(),
        total_seats: data.totalSeats,
        available_seats: data.totalSeats,
        price_per_seat: data.pricePerSeat,
        currency: data.currency || 'INR',
        auto_accept: data.autoAccept ? 1 : 0,
        luggage_policy: data.luggagePolicy || 'MEDIUM',
        smoking_allowed: data.smokingAllowed ? 1 : 0,
        pets_allowed: data.petsAllowed ? 1 : 0,
        music_allowed: data.musicAllowed !== false ? 1 : 0,
        ac_available: data.acAvailable !== false ? 1 : 0,
        women_only: data.womenOnly ? 1 : 0,
        description: data.description,
        status: JourneyStatus.PUBLISHED,
      },
      waypoints
    );

    // Create journey group chat room
    await messagingRepository.findOrCreateJourneyConversation(journeyId, driverId);

    return journey;
  }

  async getJourneyDetails(id: string) {
    const journey = await journeyRepository.findById(id);
    if (!journey) throw new NotFoundError('Journey not found');

    const driver = await userRepository.findById(journey.driver_id);
    const vehicle = await vehicleRepository.findById(journey.vehicle_id);
    const waypoints = await journeyRepository.getWaypoints(id);
    const bookings = await bookingRepository.findByJourneyId(id);

    return {
      ...journey,
      driver: driver
        ? {
            id: driver.id,
            fullName: driver.full_name,
            avatarUrl: driver.avatar_url,
            bio: driver.bio,
            ratingAverage: driver.rating_average,
            ratingCount: driver.rating_count,
            completedRidesCount: driver.completed_rides_count,
            isIdentityVerified: !!driver.is_identity_verified,
            phone: driver.phone,
          }
        : null,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            licensePlate: vehicle.license_plate,
            seatCapacity: vehicle.seat_capacity,
            vehicleType: vehicle.vehicle_type,
            amenities: JSON.parse(vehicle.amenities || '[]'),
          }
        : null,
      waypoints,
      confirmedPassengersCount: bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length,
      bookings: bookings.map((b) => ({
        id: b.id,
        passengerName: b.passenger_name,
        passengerAvatar: b.passenger_avatar,
        passengerRating: b.passenger_rating,
        seatsBooked: b.seats_booked,
        status: b.status,
      })),
    };
  }

  async updateStatus(driverId: string, userRole: UserRole, journeyId: string, newStatus: JourneyStatus) {
    const journey = await journeyRepository.findById(journeyId);
    if (!journey) throw new NotFoundError('Journey not found');

    const isDriver = journey.driver_id === driverId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isDriver && !isAdmin) {
      throw new ForbiddenError('Unauthorized to update journey status');
    }

    // Validate state transitions
    const validTransitions: Record<JourneyStatus, JourneyStatus[]> = {
      [JourneyStatus.DRAFT]: [JourneyStatus.PUBLISHED, JourneyStatus.CANCELLED],
      [JourneyStatus.PUBLISHED]: [JourneyStatus.FULL, JourneyStatus.STARTING_SOON, JourneyStatus.IN_PROGRESS, JourneyStatus.CANCELLED],
      [JourneyStatus.FULL]: [JourneyStatus.PUBLISHED, JourneyStatus.STARTING_SOON, JourneyStatus.IN_PROGRESS, JourneyStatus.CANCELLED],
      [JourneyStatus.STARTING_SOON]: [JourneyStatus.IN_PROGRESS, JourneyStatus.CANCELLED],
      [JourneyStatus.IN_PROGRESS]: [JourneyStatus.COMPLETED, JourneyStatus.CANCELLED],
      [JourneyStatus.COMPLETED]: [],
      [JourneyStatus.CANCELLED]: [],
    };

    if (!validTransitions[journey.status]?.includes(newStatus)) {
      throw new BadRequestError(`Invalid journey status transition from ${journey.status} to ${newStatus}`);
    }

    await journeyRepository.updateStatus(journeyId, newStatus);

    // If journey is CANCELLED by driver/admin, automatically cancel and refund all bookings
    if (newStatus === JourneyStatus.CANCELLED) {
      const activeBookings = await bookingRepository.findByJourneyId(journeyId);
      for (const b of activeBookings) {
        if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.REQUESTED) {
          try {
            await bookingService.cancelBooking(driverId, userRole, b.id, 'Driver cancelled entire journey');
          } catch (err) {
            logger.error(`Error auto-cancelling booking ${b.id} during journey cancellation`, err);
          }
        }
      }
    }

    // If journey COMPLETED, increment ride counters
    if (newStatus === JourneyStatus.COMPLETED) {
      await userRepository.incrementRidesCount(journey.driver_id);
      const activeBookings = await bookingRepository.findByJourneyId(journeyId);
      for (const b of activeBookings) {
        if (b.status === BookingStatus.CONFIRMED) {
          await bookingRepository.updateStatus(b.id, BookingStatus.COMPLETED);
          await userRepository.incrementRidesCount(b.passenger_id);
          // Notify passenger to rate the driver
          await notificationService.sendInAppNotification(
            b.passenger_id,
            'REVIEW_RECEIVED' as any,
            'Rate your journey!',
            `You have completed your trip to ${journey.destination_name}. Please share your review of the driver.`,
            { journeyId, driverId: journey.driver_id }
          );
        }
      }
    }

    return { success: true, journeyId, status: newStatus };
  }
}

export const journeyService = new JourneyService();
