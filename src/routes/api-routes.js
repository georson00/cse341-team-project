import { Router } from 'express';
import { getAllTrains, getTrainById } from '../controllers/trains.js';
import {
    getAllBookingsHandler,
    updateBookingHandler,
    deleteBookingHandler
} from '../controllers/bookings.js';
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
 *     summary: Retrieve authorized bookings
 *     description: >
 *       Administrators can retrieve all bookings.
 *       Customers can only retrieve bookings containing
 *       their authenticated email in the passenger list.
 *       Sign in at /login before accessing this endpoint.
 *     tags: [Bookings]
 *     security:
 *       - SessionCookie: []
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
 *         description: Authentication required.
 *       500:
 *         description: Server error while retrieving bookings.
 */
router.get('/api/bookings', requireApiLogin, getAllBookingsHandler);

/**
 * @openapi
 * /api/bookings/{id}:
 *   patch:
 *     summary: Update a booking
 *     description: >
 *       Administrators can update any booking.
 *       Customers can only update bookings associated
 *       with their authenticated email.
 *       Only ticket class, selected day, and passenger
 *       information can be modified.
 *     tags: [Bookings]
 *     security:
 *       - SessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking confirmation ID.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             additionalProperties: false
 *             properties:
 *               ticketClass:
 *                 type: string
 *                 enum: [standard, premium, first]
 *               selectedDay:
 *                 type: string
 *                 enum:
 *                   - monday
 *                   - tuesday
 *                   - wednesday
 *                   - thursday
 *                   - friday
 *                   - saturday
 *                   - sunday
 *               passengers:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 8
 *                 items:
 *                   type: object
 *                   required:
 *                     - firstName
 *                     - lastName
 *                     - email
 *                     - phone
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *           example:
 *             ticketClass: premium
 *             selectedDay: monday
 *     responses:
 *       200:
 *         description: Booking updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 booking:
 *                   type: object
 *       400:
 *         description: Invalid update fields or booking data.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: User is not authorized.
 *       404:
 *         description: Booking not found or inaccessible.
 *       500:
 *         description: Server error while updating the booking.
 */
router.patch(
    '/api/bookings/:id',
    requireApiLogin,
    updateBookingHandler
);

/**
 * @openapi
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     description: >
 *       Administrators can delete any booking.
 *       Customers can only delete bookings containing
 *       their authenticated email in the passenger list.
 *     tags: [Bookings]
 *     security:
 *       - SessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Booking confirmation ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Booking deleted successfully
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: User is not authorized.
 *       404:
 *         description: Booking not found or inaccessible.
 *       500:
 *         description: Server error while deleting the booking.
 */
router.delete(
    '/api/bookings/:id',
    requireApiLogin,
    deleteBookingHandler
);
/* =========================================================================
 * Feature Set 4: Ticket Classes
 * /api/ticket-classes, /api/ticket-classes?day={day}
 * ========================================================================= */

/* =========================================================================
 * Feature Set 5: Stations
 * /api/stations, /api/stations/{id}
 * ========================================================================= */

export default router;
