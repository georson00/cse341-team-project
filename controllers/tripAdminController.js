import mongoose from 'mongoose';

const getModels = async (req) => {
  const Trip = req.app.get('Trip') || (await import('../models/Trip.js')).Trip;
  const Station = req.app.get('Station') || (await import('../models/Station.js')).Station;
  const Schedule = req.app.get('Schedule') || (await import('../models/Schedule.js')).Schedule;
  return { Trip, Station, Schedule };
};

export async function renderTripAdminPage(req, res) {
  try {
    const { Station, Schedule } = await getModels(req);
    const [stations, schedules] = await Promise.all([
      Station.find({}).lean(),
      Schedule.find({}).lean(),
    ]);

    return res.status(200).render('trip-admin', {
      title: 'Trip Admin',
      stations,
      schedules,
    });
  } catch {
    return res.status(500).render('error', {
      title: '500 Server Error',
      message: 'Unable to load trip administration page.',
    });
  }
}

export async function listTripsApi(req, res) {
  try {
    const { Trip } = await getModels(req);
    const trips = await Trip.find({})
      .populate('station originStation destinationStation')
      .populate('schedule')
      .lean();
    return res.status(200).json(trips);
  } catch {
    return res.status(500).json({ message: 'Failed to retrieve trips' });
  }
}

export async function updateTripApi(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trip ID' });
    }

    const { Trip, Station, Schedule } = await getModels(req);
    const updates = {};

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (typeof req.body.code === 'string' && req.body.code.trim()) {
      updates.code = req.body.code.trim();
    }

    const stationId = req.body.station || req.body.stationId;
    if (stationId) {
      if (!mongoose.Types.ObjectId.isValid(stationId)) {
        return res.status(400).json({ message: 'Invalid station ID' });
      }
      const existingStation = await Station.findById(stationId).lean();
      if (!existingStation) {
        return res.status(404).json({ message: 'Selected station does not exist' });
      }
      updates.station = stationId;
    }

    const scheduleId = req.body.schedule || req.body.scheduleId;
    if (scheduleId) {
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res.status(400).json({ message: 'Invalid schedule ID' });
      }
      const existingSchedule = await Schedule.findById(scheduleId).lean();
      if (!existingSchedule) {
        return res.status(404).json({ message: 'Selected schedule does not exist' });
      }
      updates.schedule = scheduleId;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid trip fields provided for update' });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('station originStation destinationStation')
      .populate('schedule')
      .lean();

    if (!updatedTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    return res.status(200).json(updatedTrip);
  } catch {
    return res.status(500).json({ message: 'Failed to update trip' });
  }
}

export async function deleteTripApi(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid trip ID' });
    }

    const { Trip } = await getModels(req);
    const deletedTrip = await Trip.findByIdAndDelete(id).lean();

    if (!deletedTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    return res.status(200).json({ message: 'Trip deleted', id });
  } catch {
    return res.status(500).json({ message: 'Failed to delete trip' });
  }
}
