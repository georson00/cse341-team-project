import { Router } from 'express';
import { requirePageRole, requireApiRole } from '../middleware/auth.js';
import {
  renderTripAdminPage,
  listTripsAdmin,
  createTripAdmin,
  updateTripAdmin,
  deleteTripAdmin,
} from '../controllers/trip-admin.js';

export const tripAdminEjsRouter = Router();
tripAdminEjsRouter.get('/admin/trips', requirePageRole('admin'), renderTripAdminPage);

export const tripAdminApiRouter = Router();
tripAdminApiRouter.get('/trips', requireApiRole('admin'), listTripsAdmin);
tripAdminApiRouter.post('/trips', requireApiRole('admin'), createTripAdmin);
tripAdminApiRouter.put('/trips/:id', requireApiRole('admin'), updateTripAdmin);
tripAdminApiRouter.delete('/trips/:id', requireApiRole('admin'), deleteTripAdmin);
