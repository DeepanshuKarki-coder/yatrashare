import { Router } from 'express';
import { mapsController } from '../controllers/maps.controller';

const router = Router();

router.get('/places', mapsController.searchPlaces);
router.get('/route', mapsController.calculateRoute);

export default router;
