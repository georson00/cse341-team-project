//src/controllers/trips.js
import {
  getTripById as findTripById,
  getTripsPage,
} from "../models/trips.js";
import { getDb } from "../db/connect.js";
import {
  buildPagination,
  pageOffset,
  parsePagination,
} from "../utils/pagination.js";

/* =========================================================================
 * API controllers (JSON responses)
 * ========================================================================= */

// GET /api/trips/:id
export async function getTripById(req, res) {
  try {
    const { id } = req.params;

    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);

    return res.status(500).json({
      error: "Failed to fetch trip",
    });
  }
}

// GET /api/trips?page=1&limit=10
export async function getAllTrips(req, res) {
  const { page, limit, errors } = parsePagination(req.query);

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: errors,
    });
  }

  try {
    const { trips, totalItems } = await getTripsPage({
      skip: pageOffset(page, limit),
      limit,
    });

    // "trips" keeps the same key as before, so existing clients still work;
    // "pagination" tells the client where it is in the full result set.
    return res.status(200).json({
      trips,
      pagination: buildPagination({ page, limit, totalItems }),
    });
  } catch (error) {
    console.error("Error fetching trips:", error);

    return res.status(500).json({
      error: "Failed to fetch trips",
    });
  }
}

/* =========================================================================
 * EJS controllers (render pages)
 * ========================================================================= */

// GET /trips
// The trip cards and filters are loaded client-side from /api/trips
// (see hookTripsList in public/js/main.js), so no database call is needed.
export function tripsListPage(req, res) {
  return res.render("trips/list", { title: "Scenic Train Trips" });
}

// GET /trips/:tripId
export async function tripDetailsPage(req, res, next) {
  try {
    const { tripId } = req.params;

    const details = await findTripById(tripId);

    if (!details) {
      const err = new Error("Trip not found");
      err.status = 404;
      return next(err);
    }

    // TODO (Feature Set 2): remove this query once the schedules section
    // is loaded client-side from /api/trips/:id/schedules.
    details.schedules = await getDb()
      .collection("schedules")
      .find({ tripId })
      .toArray();

    return res.render("trips/details", {
      title: "Trip Details",
      details,
    });
  } catch (error) {
    return next(error);
  }
}
