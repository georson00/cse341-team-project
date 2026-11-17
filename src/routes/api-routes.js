import { Router } from 'express';
import { getAllTrains, getTrainById } from '../controllers/trains.js';

/**
 * Routes that expose JSON API endpoints.
 *
 * Each route must include an @openapi comment so it shows up in the
 * Swagger docs at /api-docs. Add your routes inside your feature set's
 * section below to avoid merge conflicts with teammates.
 */
const router = Router();

/* =========================================================================
 * Trains (example)
 * ========================================================================= */

/**
 * @openapi
 * /api/trains:
 *   get:
 *     summary: Get all trains
 *     tags: [Trains]
 *     responses:
 *       200:
 *         description: An object containing the list of trains.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error while fetching trains.
 */
router.get('/api/trains', getAllTrains);

/**
 * @openapi
 * /api/trains/{id}:
 *   get:
 *     summary: Get one train by ID
 *     tags: [Trains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: series-e353
 *     responses:
 *       200:
 *         description: The requested train.
 *       404:
 *         description: Train not found.
 *       500:
 *         description: Server error while fetching the train.
 */
router.get('/api/trains/:id', getTrainById);

/* =========================================================================
 * Feature Set 1: Trips
 * /api/trips, /api/trips/{id}
 * ========================================================================= */

/* =========================================================================
 * Feature Set 2: Schedules
 * /api/trips/{id}/schedules, /api/trips/{id}/schedules?month={month}
 * ========================================================================= */

/* =========================================================================
 * Feature Set 3: Bookings
 * /api/bookings
 * ========================================================================= */

/* =========================================================================
 * Feature Set 4: Ticket Classes
 * /api/ticket-classes, /api/ticket-classes?day={day}
 * ========================================================================= */

/* =========================================================================
 * Feature Set 5: Stations
 * /api/stations, /api/stations/{id}
 * ========================================================================= */

export default router;
