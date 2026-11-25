import Trip from '../models/trip.js';

export const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find();
    return res.status(200).json(trips);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    return res.status(200).json(trip);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createTrip = async (req, res) => {
  const trip = new Trip({
    trainNumber: req.body.trainNumber,
    origin: req.body.origin,
    destination: req.body.destination,
    departureTime: req.body.departureTime,
    arrivalTime: req.body.arrivalTime,
    price: req.body.price,
    availableSeats: req.body.availableSeats
  });

  try {
    const newTrip = await trip.save();
    return res.status(201).json(newTrip);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
