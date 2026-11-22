import mongoose from 'mongoose';
import { Trip } from '../models/schemas/trips.js';

export function renderTripAdminPage(req, res) {
  return res.status(200).render('trips/admin', {
    title: 'Trip Admin - Kizuna Rail',
  });
}

export async function listTripsAdmin(req, res) {
  try {
    const trips = await Trip.find({}).sort({ title: 1 }).lean();
    return res.status(200).json(trips);
  } catch (err) {
    console.error('Error listing trips for admin:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createTripAdmin(req, res) {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      return res.status(400).json({ message: 'Trip title is required' });
    }

    const payload = {
      title,
      description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
      originStation: typeof req.body.originStation === 'string' ? req.body.originStation.trim() : '',
      destinationStation: typeof req.body.destinationStation === 'string' ? req.body.destinationStation.trim() : '',
      durationMinutes: req.body.durationMinutes !== undefined && req.body.durationMinutes !== ''
        ? Number(req.body.durationMinutes)
        : undefined,
      scenicHighlights: Array.isArray(req.body.scenicHighlights)
        ? req.body.scenicHighlights.map((item) => String(item).trim()).filter(Boolean)
        : typeof req.body.scenicHighlights === 'string'
          ? req.body.scenicHighlights.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
    };

    const created = await Trip.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error creating trip:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateTripAdmin(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }

    const updates = {};
    if (typeof req.body.title === 'string') {
      const trimmed = req.body.title.trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Trip title cannot be empty' });
      }
      updates.title = trimmed;
    }
    if (typeof req.body.description === 'string') {
      updates.description = req.body.description.trim();
    }
    if (typeof req.body.originStation === 'string') {
      updates.originStation = req.body.originStation.trim();
    }
    if (typeof req.body.destinationStation === 'string') {
      updates.destinationStation = req.body.destinationStation.trim();
    }
    if (req.body.durationMinutes !== undefined && req.body.durationMinutes !== '') {
      const mins = Number(req.body.durationMinutes);
      if (Number.isNaN(mins) || mins < 1) {
        return res.status(400).json({ message: 'durationMinutes must be at least 1' });
      }
      updates.durationMinutes = mins;
    }
    if (req.body.scenicHighlights !== undefined) {
      updates.scenicHighlights = Array.isArray(req.body.scenicHighlights)
        ? req.body.scenicHighlights.map((item) => String(item).trim()).filter(Boolean)
        : String(req.body.scenicHighlights).split(',').map((item) => item.trim()).filter(Boolean);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const updated = await Trip.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    return res.status(200).json(updated);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error updating trip:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteTripAdmin(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }

    const deleted = await Trip.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    return res.status(200).json({ message: 'Trip deleted', id });
  } catch (err) {
    console.error('Error deleting trip:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
