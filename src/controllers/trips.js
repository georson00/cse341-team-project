//src/controllers/trips.js
import {
  TRIP_SEASONS,
  buildTripFilter,
  getTripById as findTripById,
  getTripRegions,
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

const REGION_PATTERN = /^[a-z0-9-]{1,40}$/;
const MAX_KEYWORD_LENGTH = 100;

// Reads one optional text query param. Missing/blank -> null.
// Repeated params (?season=a&season=b) arrive as an array and are rejected.
function readText(query, name) {
  const raw = query[name];
  if (raw === undefined) {
    return { value: null };
  }
  if (typeof raw !== "string") {
    return { error: `${name} must be a single value` };
  }
  const value = raw.trim();
  return { value: value === "" ? null : value };
}

// Validates ?region, ?season and ?q. Returns { filters, errors }.
function parseTripFilters(query = {}) {
  const errors = [];
  const region = readText(query, "region");
  const season = readText(query, "season");
  const q = readText(query, "q");

  for (const result of [region, season, q]) {
    if (result.error) {
      errors.push(result.error);
    }
  }

  const filters = {
    region: region.value?.toLowerCase() ?? null,
    season: season.value?.toLowerCase() ?? null,
    q: q.value,
  };

  if (filters.region && !REGION_PATTERN.test(filters.region)) {
    errors.push("region may only contain letters, numbers and dashes (max 40 characters)");
  }
  if (filters.season && !TRIP_SEASONS.includes(filters.season)) {
    errors.push(`season must be one of: ${TRIP_SEASONS.join(", ")}`);
  }
  if (filters.q && filters.q.length > MAX_KEYWORD_LENGTH) {
    errors.push(`q must be ${MAX_KEYWORD_LENGTH} characters or fewer`);
  }

  return { filters, errors };
}

// GET /api/trips?page=1&limit=10&region=kansai&season=autumn&q=gorge
export async function getAllTrips(req, res) {
  const pagination = parsePagination(req.query);
  const { filters, errors: filterErrors } = parseTripFilters(req.query);
  const errors = [...pagination.errors, ...filterErrors];

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: errors,
    });
  }

  const { page, limit } = pagination;

  try {
    // Filters run in the database before paging, so totalItems and
    // totalPages describe the filtered results, not the whole collection.
    const [{ trips, totalItems }, regions] = await Promise.all([
      getTripsPage({
        filter: buildTripFilter(filters),
        skip: pageOffset(page, limit),
        limit,
      }),
      getTripRegions(),
    ]);

    // "trips" keeps the same key as before, so existing clients still work;
    // "pagination" and "filters" describe the query that was run, and
    // "filterOptions" lists every value the dropdowns can offer.
    return res.status(200).json({
      trips,
      pagination: buildPagination({ page, limit, totalItems }),
      filters,
      filterOptions: { regions, seasons: TRIP_SEASONS },
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
