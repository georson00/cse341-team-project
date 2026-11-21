import { Trip } from './schemas/trips.js';

export async function getAllTrips() {
  return Trip.find({});
}

export async function getTripById(id) {
  return Trip.findById(id);
}
