import { Router } from 'express';
import { requirePageRole, requireApiRole } from '../middleware/auth.js';
import {
  renderTripAdminPage,
  listTripsApi,
  updateTripApi,
  deleteTripApi,
} from '../controllers/tripAdminController.js';

const router = Router();

router.get('/admin/trips', requirePageRole('admin'), renderTripAdminPage);
router.get('/api/trips', requireApiRole('admin'), listTripsApi);
router.put('/api/trips/:id', requireApiRole('admin'), updateTripApi);
router.delete('/api/trips/:id', requireApiRole('admin'), deleteTripApi);

export default router;
