import mongoose from 'mongoose';

const passengerSchema = new mongoose.Schema(
    {
    firstName: {
        type: String,
        required: true,
        trim: true

    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    }

},
{ _id: false }

);

const bookingSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        scheduleId: {
            type: Number,
            required: true,
            min: 1,
            validate:{
                validator: Number.isInteger,
                message: 'Schedule ID must be an integer'
            }
        },
        tripId: {
            type: String,
            required: true,
            trim: true
        },
        ticketClass: {
            type: String,
            required: true,
            enum: ['standard', 'premium', 'first']
        },
         selectedDay: {
      type: String,
      required: true,
      enum: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]
    },
    passengers: {
      type: [passengerSchema],
      required: true,
      validate: {
        validator: (passengers) =>
          passengers.length >= 1 && passengers.length <= 8,
        message: 'A booking must have between 1 and 8 passengers'
      }
    }
  },
  {
    timestamps: true,
    collection: 'bookings'
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;