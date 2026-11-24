import { Router } from 'express';
import {
  renderTripAdminPage,
  listTripsAdmin,
  createTripAdmin,
  updateTripAdmin,
  deleteTripAdmin,
} from '../controllers/trip-admin.js';

export const tripAdminEjsRouter = Router();
tripAdminEjsRouter.get('/admin/trips', renderTripAdminPage);

export const tripAdminApiRouter = Router();
tripAdminApiRouter.get('/trips', listTripsAdmin);
tripAdminApiRouter.post('/trips', createTripAdmin);
tripAdminApiRouter.put('/trips/:id', updateTripAdmin);
tripAdminApiRouter.delete('/trips/:id', deleteTripAdmin);
