import { Router } from 'express';
import { getAllTrains, getTrainById } from '../controllers/trains.js';
import { getAllBookingsHandler } from '../controllers/bookings.js';
import { requireBookingAdmin } from '../middleware/requireBookingAdmin.js';
import { getCurrentUser } from '../controllers/auth.js';
import { requireApiLogin } from '../middleware/auth.js';
/**
 * Routes that expose JSON API endpoints.
 *
 * Each route must include an @openapi comment so it shows up in the
 * Swagger docs at /api-docs. Add your routes inside your feature set's
 * section below to avoid merge conflicts with teammates.
 */
import { tripAdminApiRouter } from './trip-admin.js';

const router = Router();

router.use(tripAdminApiRouter);

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
 * W04 Feature Set 1: Core Authentication
 * Protected API routes use requireApiLogin() or requireApiRole(role) from
 * src/middleware/auth.js and document the 401/403 responses below.
 * ========================================================================= */

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the signed-in user
 *     description: >
 *       Returns the user stored in the session. Sign in at /login first; the
 *       browser then sends the kizuna.sid session cookie automatically.
 *     tags: [Authentication]
 *     security:
 *       - SessionCookie: []
 *     responses:
 *       200:
 *         description: The signed-in user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/SessionUser'
 *       401:
 *         description: Not signed in.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *             example: { message: Authentication required }
 */
router.get('/api/auth/me', requireApiLogin, getCurrentUser);

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

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Retrieve all bookings
 *     description: Returns booking records for authorized administrators.
 *     tags: [Bookings]
 *     security:
 *       - AdminApiKey: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Admin API key is missing.
 *       403:
 *         description: Admin API key is invalid.
 *       500:
 *         description: Server error while retrieving bookings.
 *       503:
 *         description: Admin API access is not configured.
 */
router.get('/api/bookings', requireBookingAdmin, getAllBookingsHandler);


/* =========================================================================
 * Feature Set 4: Ticket Classes
 * /api/ticket-classes, /api/ticket-classes?day={day}
 * ========================================================================= */

/* =========================================================================
 * Feature Set 5: Stations
 * /api/stations, /api/stations/{id}
 * ========================================================================= */

export default router;
