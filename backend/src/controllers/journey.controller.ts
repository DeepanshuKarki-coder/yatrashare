import { Request, Response, NextFunction } from 'express';
import { journeyService } from '../services/journey.service';
import { journeyRepository } from '../repositories/journey.repository';

export class JourneyController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await journeyRepository.searchJourneys(req.query as any);
      return res.status(200).json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const journey = await journeyService.getJourneyDetails(req.params.id);
      return res.status(200).json({ success: true, data: journey });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const journey = await journeyService.createJourney(req.user!.userId, req.body);
      return res.status(201).json({ success: true, data: journey });
    } catch (err) {
      next(err);
    }
  }

  async getDriverJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const journeys = await journeyRepository.findByDriverId(req.user!.userId);
      return res.status(200).json({ success: true, data: journeys });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.updateStatus(
        req.user!.userId,
        req.user!.role,
        req.params.id,
        req.body.status
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const journeyController = new JourneyController();
