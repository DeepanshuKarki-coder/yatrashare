import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { vehicleRepository } from '../repositories/vehicle.repository';
import { NotFoundError } from '../utils/errors';

export class VehicleController {
  async getMyVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicles = await vehicleRepository.findByUserId(req.user!.userId);
      const formatted = vehicles.map((v) => ({
        ...v,
        amenities: JSON.parse(v.amenities || '[]'),
        isDefault: !!v.is_default,
      }));
      return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = uuidv4();
      const vehicle = await vehicleRepository.create({
        id,
        user_id: req.user!.userId,
        make: req.body.make,
        model: req.body.model,
        year: req.body.year,
        color: req.body.color,
        license_plate: req.body.licensePlate.toUpperCase().trim(),
        seat_capacity: req.body.seatCapacity,
        vehicle_type: req.body.vehicleType,
        amenities: JSON.stringify(req.body.amenities || []),
        photo_url: req.body.photoUrl,
        is_default: req.body.isDefault ? 1 : 0,
      });

      return res.status(201).json({
        success: true,
        data: {
          ...vehicle,
          amenities: JSON.parse(vehicle.amenities),
          isDefault: !!vehicle.is_default,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.params.id;
      const updates: any = {};
      if (req.body.make) updates.make = req.body.make;
      if (req.body.model) updates.model = req.body.model;
      if (req.body.year) updates.year = req.body.year;
      if (req.body.color) updates.color = req.body.color;
      if (req.body.licensePlate) updates.license_plate = req.body.licensePlate.toUpperCase().trim();
      if (req.body.seatCapacity) updates.seat_capacity = req.body.seatCapacity;
      if (req.body.vehicleType) updates.vehicle_type = req.body.vehicleType;
      if (req.body.amenities) updates.amenities = JSON.stringify(req.body.amenities);
      if (req.body.photoUrl !== undefined) updates.photo_url = req.body.photoUrl;
      if (req.body.isDefault !== undefined) updates.is_default = req.body.isDefault ? 1 : 0;

      const vehicle = await vehicleRepository.update(vehicleId, req.user!.userId, updates);
      return res.status(200).json({
        success: true,
        data: {
          ...vehicle,
          amenities: JSON.parse(vehicle.amenities),
          isDefault: !!vehicle.is_default,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.params.id;
      const deleted = await vehicleRepository.delete(vehicleId, req.user!.userId);
      if (!deleted) throw new NotFoundError('Vehicle not found or unauthorized');
      return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const vehicleController = new VehicleController();
