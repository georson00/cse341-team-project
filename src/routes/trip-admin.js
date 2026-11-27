import { Router } from 'express';
import { requirePageRole, requireApiRole } from '../middleware/auth.js';
import {
  renderTripAdminPage,
  createTripAdmin,
  updateTripAdmin,
  deleteTripAdmin,
} from '../controllers/trip-admin.js';

export const tripAdminEjsRouter = Router();
tripAdminEjsRouter.get('/admin/trips', requirePageRole('admin'), renderTripAdminPage);

export const tripAdminApiRouter = Router();
// GET /api/trips is the public trip list in api-routes.js (Feature Set 1, W03);
// the admin page reads the same endpoint.
tripAdminApiRouter.post('/api/trips', requireApiRole('admin'), createTripAdmin);
tripAdminApiRouter.put('/api/trips/:id', requireApiRole('admin'), updateTripAdmin);
tripAdminApiRouter.delete('/api/trips/:id', requireApiRole('admin'), deleteTripAdmin);
