//src/models/trips.js
import trip from "./schemas/trips.js";

// Returns one trip by its string ID (e.g. "alpine-panorama"), or null.
export async function getTripById(id) {
  return trip.findOne({ id }).lean();
}

// Returns every trip, sorted by name so the list page is predictable.
export async function getAllTrips() {
  return trip.find({}).sort({ name: 1 }).lean();
}
