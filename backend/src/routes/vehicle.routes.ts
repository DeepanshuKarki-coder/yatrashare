import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createVehicleSchema, updateVehicleSchema, UserRole } from '@yatrashare/shared';

const router = Router();

router.use(requireAuth);
router.get('/my-vehicles', vehicleController.getMyVehicles);
router.post('/', requireRole([UserRole.DRIVER, UserRole.ADMIN]), validateBody(createVehicleSchema), vehicleController.createVehicle);
router.put('/:id', requireRole([UserRole.DRIVER, UserRole.ADMIN]), validateBody(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', requireRole([UserRole.DRIVER, UserRole.ADMIN]), vehicleController.deleteVehicle);

export default router;
