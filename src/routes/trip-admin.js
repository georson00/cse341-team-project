import { Router } from 'express';
import { requirePageRole, requireApiRole } from '../middleware/auth.js';
import {
  renderTripAdminPage,
  listTripsAdmin,
  listStationOptionsAdmin,
  createTripAdmin,
  updateTripAdmin,
  deleteTripAdmin,
} from '../controllers/trip-admin.js';

export const tripAdminEjsRouter = Router();
tripAdminEjsRouter.get('/admin/trips', requirePageRole('admin'), renderTripAdminPage);

export const tripAdminApiRouter = Router();
tripAdminApiRouter.get('/api/trips/stations', requireApiRole('admin'), listStationOptionsAdmin);
tripAdminApiRouter.get('/api/trips', requireApiRole('admin'), listTripsAdmin);
tripAdminApiRouter.post('/api/trips', requireApiRole('admin'), createTripAdmin);
tripAdminApiRouter.put('/api/trips/:id', requireApiRole('admin'), updateTripAdmin);
tripAdminApiRouter.delete('/api/trips/:id', requireApiRole('admin'), deleteTripAdmin);
