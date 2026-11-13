import { Router } from 'express';
import { getAllTrains, getTrainById } from '../controllers/trains.js';
import { getAllTrips, getTripById } from '../controllers/trips.js';

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

/**
 * @openapi
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         id: { type: string, example: alpine-panorama }
 *         name: { type: string, example: Alpine Panorama Express }
 *         description: { type: string }
 *         region: { type: string, example: central }
 *         startStation: { type: string, example: nagoya }
 *         endStation: { type: string, example: toyama }
 *         duration: { type: string, example: 4.5 hours }
 *         distance: { type: number, example: 180 }
 *         highlights:
 *           type: array
 *           items: { type: string }
 *         bestSeason:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *         operatingMonths:
 *           type: array
 *           items: { type: integer, minimum: 1, maximum: 12 }
 *         imageUrl: { type: string, example: /images/routes/alpine-panorama.png }
 *     Error:
 *       type: object
 *       properties:
 *         error: { type: string }
 */

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: An object containing the list of trips, sorted by name.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Server error while fetching trips.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/api/trips', getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *     responses:
 *       200:
 *         description: The requested trip.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error while fetching the trip.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/api/trips/:id', getTripById);

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
