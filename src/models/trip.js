import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  id: { type: String, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  region: String,
  startStation: String,
  endStation: String,
  duration: String,
  distance: Number,
  highlights: [String],
  bestSeason: String,
  operatingMonths: [Number],
  imageUrl: String,
}, { collection: 'trips' });

export default mongoose.model('Trip', tripSchema);
