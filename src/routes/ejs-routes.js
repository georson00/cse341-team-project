import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from '../controllers/trains.js';
import { tripsListPage, tripDetailsPage } from '../controllers/trips.js';
import railTripsRouter from './trips.js';

/**
 * Routes that render EJS pages.
 *
 * The /trips routes still use the legacy files in src/routes (trips.js,
 * list.js, details.js, book.js, confirm.js). Feature Sets 1 and 3 move those
 * into controllers and register the routes in their sections below.
 */
const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page (example: content is loaded client-side from /api/trains)
router.get('/trains', trainsPage);

// Test 500 error page
router.get('/500', testErrorPage);

/* =========================================================================
 * Feature Set 1: Trips (trip list and trip details pages)
 * ========================================================================= */

// Trip list page (content is loaded client-side from /api/trips)
router.get('/trips', tripsListPage);

// Trip details page. Only matches one path segment, so it does not catch
// the legacy /trips/booking/... and /trips/confirmation/... routes.
router.get('/trips/:tripId', tripDetailsPage);

/* =========================================================================
 * Feature Set 3: Bookings (booking page, confirmation, /bookings-admin)
 * ========================================================================= */

// Legacy trip routes: remove each one as it is moved into the sections above.
router.use('/trips', railTripsRouter);

export default router;
