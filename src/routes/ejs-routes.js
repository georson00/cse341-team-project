import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from '../controllers/trains.js';
import { tripsListPage, tripDetailsPage } from '../controllers/trips.js';
import {
  bookingPage,
  processBookingRequest,
  confirmationPage,
  bookingsAdminPage
} from '../controllers/bookings.js';

import {
    adminLoginPage,
    processAdminLogin,
    processAdminLogout
} from '../controllers/adminAuth.js';

import { requireAdminPage } from '../middleware/requireAdminPage.js';

/**
 * Routes that render EJS pages.
 *
 * Each feature set registers its page routes in its own section below.
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
// Administrator authentication
router.get('/admin/login', adminLoginPage);
router.post('/admin/login', processAdminLogin);

// Administrator logout
router.post('/admin/logout', requireAdminPage, processAdminLogout);

// Protected bookings administration dashboard
router.get('/bookings-admin', requireAdminPage, bookingsAdminPage);

// Display the booking form for a selected schedule.
router.get('/trips/booking/:scheduleId', bookingPage);

// Process a submitted booking.
router.post('/trips/book', processBookingRequest);

// Display the booking confirmation.
router.get('/trips/confirmation/:confirmationId', confirmationPage);

export default router;
