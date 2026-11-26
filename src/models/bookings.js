
import Booking from './schemas/bookings.js';

const getAllBookings = async () => {
  return await Booking.find({}).sort({ createdAt: -1 }).lean();
};

const getBookingsByPassengerEmail = async (email) => {
    return await Booking.find({
        'passengers.email': email.trim().toLowerCase()
    })
        .sort({ createdAt: -1 })
        .lean();
};

const getBookingById = async (id) => {
    return await Booking.findOne({ id }).lean();
};

const createBooking = async (bookingData) => {
    const booking = new Booking(bookingData);
    return await booking.save();
};

const updateBooking = async (id, updates, passengerEmail) => {
    const filter = { id };

    if (passengerEmail !== null) {
        filter['passengers.email'] =
            passengerEmail.trim().toLowerCase();
    }

    return await Booking.findOneAndUpdate(
        filter,
        { $set: updates },
        {
            returnDocument: 'after',
            runValidators: true
        }
    ).lean();
};

const deleteBooking = async (id, passengerEmail) => {
    const filter = { id };

    if (passengerEmail !== null) {
        filter['passengers.email'] =
            passengerEmail.trim().toLowerCase();
    }

    return await Booking.findOneAndDelete(filter).lean();
};

export {
    getAllBookings,
    getBookingsByPassengerEmail,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking
};
