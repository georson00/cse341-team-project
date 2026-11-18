import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from '../controllers/trains.js';
import railTripsRouter from './trips.js';
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

// Legacy trip routes: remove each one as it is moved into the sections above.
router.use('/trips', railTripsRouter);

export default router;
