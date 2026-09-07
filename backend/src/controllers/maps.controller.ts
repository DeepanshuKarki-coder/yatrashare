import { Request, Response, NextFunction } from 'express';
import { mapsService } from '../services/maps/maps.service';

export class MapsController {
  async searchPlaces(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const places = await mapsService.searchPlaces(q);
      return res.status(200).json({ success: true, data: places });
    } catch (err) {
      next(err);
    }
  }

  async calculateRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const { originLat, originLng, destLat, destLng } = req.query;
      const origin = { lat: Number(originLat), lng: Number(originLng) };
      const dest = { lat: Number(destLat), lng: Number(destLng) };
      const route = await mapsService.calculateRoute(origin, dest);
      return res.status(200).json({ success: true, data: route });
    } catch (err) {
      next(err);
    }
  }
}

export const mapsController = new MapsController();
