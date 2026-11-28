import { Router } from 'express';
import { getAllTrains, getTrainById } from '../controllers/trains.js';
import { getAllTrips, getTripById } from '../controllers/trips.js';
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
 *     Pagination:
 *       type: object
 *       description: Where this response sits in the full result set.
 *       properties:
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         totalItems: { type: integer, example: 6 }
 *         totalPages: { type: integer, example: 1 }
 *         hasNextPage: { type: boolean, example: false }
 *         hasPrevPage: { type: boolean, example: false }
 *     Error:
 *       type: object
 *       properties:
 *         error: { type: string }
 *     QueryError:
 *       type: object
 *       properties:
 *         error: { type: string, example: Invalid query parameters }
 *         details:
 *           type: array
 *           items: { type: string }
 *           example: [limit must be an integer between 1 and 50]
 */

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get a page of trips, optionally filtered and searched
 *     description: >
 *       Returns trips sorted by name, `limit` at a time. `region`, `season` and `q`
 *       are combined with AND and applied before paging, so `pagination.totalItems`
 *       counts only the matching trips. Asking for a page past the end returns an
 *       empty `trips` array with the real pagination metadata.
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: region
 *         schema: { type: string, pattern: '^[a-z0-9-]{1,40}$' }
 *         example: kansai
 *         description: Only trips in this region (case-insensitive).
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *         description: Only trips whose best season matches.
 *       - in: query
 *         name: q
 *         schema: { type: string, maxLength: 100 }
 *         example: gorge
 *         description: Keyword matched anywhere in the trip name or description (case-insensitive, plain text).
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: Page number, starting at 1.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *         description: Number of trips per page.
 *     responses:
 *       200:
 *         description: One page of trips plus pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 filters:
 *                   type: object
 *                   description: The filters that were applied (null when not used).
 *                   properties:
 *                     region: { type: string, nullable: true, example: kansai }
 *                     season: { type: string, nullable: true, example: null }
 *                     q: { type: string, nullable: true, example: gorge }
 *                 filterOptions:
 *                   type: object
 *                   description: Every value the region and season filters accept, taken from the whole collection.
 *                   properties:
 *                     regions:
 *                       type: array
 *                       items: { type: string }
 *                       example: [central, hokkaido, kansai, northern]
 *                     seasons:
 *                       type: array
 *                       items: { type: string }
 *                       example: [spring, summer, autumn, winter]
 *       400:
 *         description: "`page`/`limit` is not a valid integer or is out of range, `season` is not a known season, `region` has invalid characters, `q` is too long, or a parameter was repeated."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueryError'
 *             example:
 *               error: Invalid query parameters
 *               details: [page must be an integer of at least 1, 'season must be one of: spring, summer, autumn, winter']
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
