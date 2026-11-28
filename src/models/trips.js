//src/models/trips.js
// Uses the single "Trip" model shared with the trip admin page (Feature Set 5).
import trip from "./trip.js";

// Sorted by name so the list is predictable; _id breaks ties so two trips
// with the same name never move between pages.
const TRIP_SORT = { name: 1, _id: 1 };

// Returns one trip by its string ID (e.g. "alpine-panorama"), or null.
export async function getTripById(id) {
  return trip.findOne({ id }).lean();
}

// Returns one page of trips plus the total number of matching trips.
export async function getTripsPage({ filter = {}, skip = 0, limit = 10 } = {}) {
  const [trips, totalItems] = await Promise.all([
    trip.find(filter).sort(TRIP_SORT).skip(skip).limit(limit).lean(),
    trip.countDocuments(filter),
  ]);

  return { trips, totalItems };
}
