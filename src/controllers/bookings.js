
import { getDb } from '../db/connect.js';
import { createBooking, getBookingById, getAllBookings} from '../models/bookings.js';
import { generateConfirmationCode } from '../includes/helpers.js';

const bookingPage = async (req, res) => {
  try {
    const scheduleId = Number(req.params.scheduleId);

    if (!Number.isSafeInteger(scheduleId) || scheduleId <= 0) {
      return res.status(400).send('Invalid schedule ID');
    }

    const db = getDb();

    const schedule = await db.collection('schedules').findOne({
      id: scheduleId
    });

    if (!schedule) {
      return res.status(404).send('Schedule not found');
    }

    if (schedule.status !== true) {
      return res.status(400).send('This schedule is unavailable');
    }

    const trip = await db.collection('trips').findOne({
      id: schedule.tripId
    });

    if (!trip) {
      return res.status(404).send('Trip not found');
    }

    const ticketClasses = await db
      .collection('ticketClasses')
      .find({})
      .toArray();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: trip.distance * ticketClass.pricePerKm,
      amenities: ticketClass.amenities,
      description: ticketClass.description
    }));

    return res.render('trips/book', {
      title: 'Book Trip',
      schedule,
      ticketOptions
    });
  } catch (error) {
    console.error('Error loading booking page:', error);
    return res.status(500).send('Unable to load booking page');
  }
};


const processBookingRequest = async (req, res) => {
  const {
    scheduleId,
    ticketClass,
    selectedDay,
    passengers
  } = req.body;

  const parsedScheduleId = Number(scheduleId);

  if (!Number.isSafeInteger(parsedScheduleId) || parsedScheduleId <= 0) {
    return res.status(400).send('Invalid schedule ID');
  }

  const validTicketClasses = ['standard', 'premium', 'first'];

  if (!validTicketClasses.includes(ticketClass)) {
    return res.status(400).send('Invalid ticket class');
  }

  const validDays = [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
  ];

  if (!validDays.includes(selectedDay)) {
    return res.status(400).send('Invalid selected day');
  }

  if (!Array.isArray(passengers) ||
      passengers.length < 1 ||
      passengers.length > 8) {
    return res.status(400).send('A booking requires 1 to 8 passengers');
  }

  for (const passenger of passengers) {
    if (!passenger ||
        typeof passenger !== 'object' ||
        Array.isArray(passenger) ||
        ['firstName', 'lastName', 'email', 'phone'].some(
          (field) =>
            typeof passenger[field] !== 'string' ||
            !passenger[field].trim()
        )) {
      return res.status(400).send('Invalid passenger information');
    }
  }

try {
const db = getDb();

const schedule = await db.collection('schedules').findOne({
  id: parsedScheduleId
});

if (!schedule) {
  return res.status(404).send('Schedule not found');
}

if (schedule.status !== true) {
  return res.status(400).send('This schedule is unavailable');
}

if (!Array.isArray(schedule.daysOfWeek) ||
    !schedule.daysOfWeek.includes(selectedDay)) {
  return res.status(400).send(
    'The selected day is not available for this schedule'
  );
}


const ticketClassRecord = await db.collection('ticketClasses').findOne({
  class: ticketClass
});

if (!ticketClassRecord) {
  return res.status(400).send('The selected ticket class is unavailable');
}


const bookingData = {
  id: generateConfirmationCode(),
  scheduleId: parsedScheduleId,
  tripId: schedule.tripId,
  ticketClass,
  selectedDay,
  passengers: passengers.map((passenger) => ({
    firstName: passenger.firstName.trim(),
    lastName: passenger.lastName.trim(),
    email: passenger.email.trim(),
    phone: passenger.phone.trim()
  }))
};

let booking;

for (let attempt = 0; attempt < 3; attempt++) {
    try {
        booking = await createBooking(bookingData);
        break;
    } catch (error) {
        const duplicateBookingId =
            error.code === 11000 &&
            Object.prototype.hasOwnProperty.call(
                error.keyPattern ?? {},
                'id'
            );

        if (!duplicateBookingId || attempt === 2) {
            throw error;
        }

        bookingData.id = generateConfirmationCode();
    }
}

return res.redirect(`/trips/confirmation/${booking.id}`);

} catch (error) {
  console.error('Error processing booking:', error);
  return res.status(500).send('Unable to process booking');
}

};



const confirmationPage = async (req, res) => {
  try {
    const { confirmationId } = req.params;

    const booking = await getBookingById(confirmationId);

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    return res.render('trips/confirm', {
      title: 'Trip Confirmation',
      confirmation: booking
    });
  } catch (error) {
    console.error('Error loading booking confirmation:', error);
    return res.status(500).send('Unable to load booking confirmation');
  }
};
const getAllBookingsHandler = async (req, res) => {
  try {
    const bookings = await getAllBookings();

    return res.status(200).json({
      bookings
    });
  } catch (error) {
    console.error('Error retrieving bookings:', error);

    return res.status(500).json({
      message: 'Unable to retrieve bookings'
    });
  }
};

export {
  bookingPage,
  processBookingRequest,
  confirmationPage,
  getAllBookingsHandler
};

export const bookingsAdminPage = (req, res) => {
    return res.render('bookings', {
        title: 'Bookings Administration'
    });
};