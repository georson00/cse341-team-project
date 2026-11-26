import Schedule from './schemas/schedules.js';

const dayNames = [
  'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday'
];

export const getSchedulesByTripId = async (tripId, month = null) => {
  const query = { tripId };

  if (month !== null) {
    const monthNumber = Number(month);

    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      throw new Error('Month must be a number between 1 and 12.');
    }

    const year = new Date().getFullYear();
    const weekdays = new Set();

    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      weekdays.add(dayNames[new Date(year, monthNumber - 1, day).getDay()]);
    }

    query.daysOfWeek = { $in: [...weekdays] };
  }

  return Schedule.find(query).sort({ departureTime: 1 });
};
