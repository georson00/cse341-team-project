import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  trainNumber: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  price: { type: Number, required: true },
  availableSeats: { type: Number, required: true }
}, {
  timestamps: true
});

export default mongoose.model('Trip', tripSchema);
