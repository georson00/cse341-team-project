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

import {
    requirePageRole,
    requirePageLogin
} from '../middleware/auth.js';
import {
    registerPage,
    register,
    loginPage,
    login,
    logout,
    adminDashboardPage
} from '../controllers/auth.js';
import { requireAdminPage } from '../middleware/requireAdminPage.js'
import { ROLE_NAMES } from '../models/schemas/roles.js';

/**
 * Routes that render EJS pages.
 *
 * The /trips routes still use the legacy files in src/routes (trips.js,
 * list.js, details.js, book.js, confirm.js). Feature Sets 1 and 3 move those
 * into controllers and register the routes in their sections below.
 */
import { tripAdminEjsRouter } from './trip-admin.js';

const router = Router();

router.use(tripAdminEjsRouter);

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page (example: content is loaded client-side from /api/trains)
router.get('/trains', trainsPage);

// Test 500 error page
router.get('/500', testErrorPage);

/* =========================================================================
 * W04 Feature Set 1: Core Authentication
 * ========================================================================= */

// Register and sign in
router.get('/register', registerPage);
router.post('/register', register);
router.get('/login', loginPage);
router.post('/login', login);

// Sign out (POST so a link or image cannot sign someone out)
router.post('/logout', logout);

// Admin Dashboard: signed out -> /login, signed in without admin role -> 403
router.get('/admin/dashboard', requirePageRole(ROLE_NAMES.ADMIN), adminDashboardPage);

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

// Protected booking page accessible to authenticated customers and admins.
router.get('/bookings-admin', requirePageLogin, bookingsAdminPage);

// Display the booking form for a selected schedule.
router.get('/trips/booking/:scheduleId', bookingPage);

// Process a submitted booking.
router.post('/trips/book', processBookingRequest);

// Display the booking confirmation.
router.get('/trips/confirmation/:confirmationId', confirmationPage);

// Legacy trip routes: remove each one as it is moved into the sections above.
router.use('/trips', railTripsRouter);

export default router;
