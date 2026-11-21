import mongoose from 'mongoose';
import { getAllTrips as findAllTrips, getTripById as findTripById } from '../models/trips.js';

export async function getAllTrips(req, res) {
  try {
    const trips = await findAllTrips();
    return res.status(200).json(trips);
  } catch (err) {
    console.error('Internal server error (getAllTrips):', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getTripById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }

    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    return res.status(200).json(trip);
  } catch (err) {
    console.error('Internal server error (getTripById):', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export function renderTripsList(req, res) {
  return res.render('trips/list', {
    title: 'Trips - Kizuna Rail',
  });
}

export async function renderTripDetails(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).render('error', {
        title: 'Invalid Trip',
        message: 'Invalid trip ID.',
      });
    }

    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).render('error', {
        title: 'Trip Not Found',
        message: 'Trip not found.',
      });
    }

    return res.render('trips/details', {
      title: trip.title || 'Trip Details',
      trip,
    });
  } catch (err) {
    console.error('Internal server error (renderTripDetails):', err);
    return res.status(500).render('error', {
      title: 'Server Error',
      message: 'Internal server error',
    });
  }
}
