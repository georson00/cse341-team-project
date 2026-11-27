import mongoose from 'mongoose';
import Trip from '../models/trip.js';

function slugify(text) {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `trip-${Date.now()}`;
}

async function uniqueTripId(name) {
  const base = slugify(name);
  let candidate = base;
  let n = 2;
  while (await Trip.exists({ id: candidate })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

function toHighlights(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function renderTripAdminPage(req, res) {
  return res.status(200).render('trips/admin', {
    title: 'Trip Admin - Kizuna Rail',
  });
}

export async function createTripAdmin(req, res) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      return res.status(400).json({ message: 'Trip name is required' });
    }

    const payload = {
      id: await uniqueTripId(name),
      name,
      description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
      startStation: typeof req.body.startStation === 'string' ? req.body.startStation.trim() : '',
      endStation: typeof req.body.endStation === 'string' ? req.body.endStation.trim() : '',
      duration: typeof req.body.duration === 'string' ? req.body.duration.trim() : '',
      highlights: toHighlights(req.body.highlights),
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
    if (typeof req.body.name === 'string') {
      const trimmed = req.body.name.trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Trip name cannot be empty' });
      }
      updates.name = trimmed;
    }
    if (typeof req.body.description === 'string') {
      updates.description = req.body.description.trim();
    }
    if (typeof req.body.startStation === 'string') {
      updates.startStation = req.body.startStation.trim();
    }
    if (typeof req.body.endStation === 'string') {
      updates.endStation = req.body.endStation.trim();
    }
    if (typeof req.body.duration === 'string') {
      updates.duration = req.body.duration.trim();
    }
    if (req.body.highlights !== undefined) {
      updates.highlights = toHighlights(req.body.highlights);
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
