
import Booking from './schemas/bookings.js';

const getAllBookings = async () => {
  return await Booking.find({}).sort({ createdAt: -1 }).lean();
};


const getBookingById = async (id) => {
    return await Booking.findOne({ id }).lean();
};

const createBooking = async (bookingData) => {
    const booking = new Booking(bookingData);
    return await booking.save();
};


export { getAllBookings, getBookingById, createBooking };
