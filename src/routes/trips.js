import { bookingPage, processBookingRequest } from './book.js';
import confirmationPage from './confirm.js';
import { Router } from 'express';

// Legacy booking routes, mounted at /trips in ejs-routes.js.
// The trip list and details routes now live in ejs-routes.js (Feature Set 1).
// Feature Set 3 moves the remaining routes into controllers/bookings.js.
const router = Router();

// Book ticket
router.get('/booking/:scheduleId', bookingPage);
router.post('/book', processBookingRequest);

// Booking confirmation page
router.get('/confirmation/:confirmationId', confirmationPage);

export default router;
