import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    originStation: {
      type: String,
      trim: true,
    },
    destinationStation: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      min: 1,
    },
    scenicHighlights: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Trip = mongoose.model('Trip', tripSchema);
export default tripSchema;
