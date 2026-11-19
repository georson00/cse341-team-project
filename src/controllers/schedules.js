import { getSchedulesByTripId } from '../models/schedules.js';

export const getSchedulesForTrip = async (req, res) => {
  try {
    const schedules = await getSchedulesByTripId(req.params.id);
    return res.status(200).json(schedules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSchedulesForTripAndMonth = async (req, res) => {
  try {
    const schedules = await getSchedulesByTripId(
      req.params.id,
      req.query.month
    );

    return res.status(200).json(schedules);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
