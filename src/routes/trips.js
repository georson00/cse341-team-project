import { Router } from 'express';
import { getAllTrips, getTripById, createTrip } from '../controllers/trips.js';

const router = Router();

// GET all trips
router.get('/', getAllTrips);

// GET single trip by ID
router.get('/:id', getTripById);

// POST create a new trip
router.post('/', createTrip);

export default router;
