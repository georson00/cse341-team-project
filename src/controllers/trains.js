//src/controllers/trains.js
import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
} from "../models/trains.js";

export async function getTrainById(req, res) {
  try {
    const { id } = req.params;

    const train = await findTrainById(id);

    if (!train) {
      return res.status(404).json({
        error: "Train not found",
      });
    }

    return res.status(200).json(train);
  } catch (error) {
    console.error("Error fetching train:", error);

    return res.status(500).json({
      error: "Failed to fetch train",
    });
  }
}

export async function getAllTrains(req, res) {
  try {
    const trains = await findAllTrains();

    // Wrapped in { trains } to keep the existing API contract used by
    // public/js/main.js and tests/trains.test.js.
    return res.status(200).json({ trains });
  } catch (error) {
    console.error("Error fetching trains:", error);

    return res.status(500).json({
      error: "Failed to fetch trains",
    });
  }
}

// EJS controller: renders the trains page. The train cards are loaded
// client-side from /api/trains (see hookTrainsCatalog in public/js/main.js).
export function trainsPage(req, res) {
  return res.render("trains", { title: "Trains" });
}