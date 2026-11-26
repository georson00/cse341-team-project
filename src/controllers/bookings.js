import { getDb } from "../db/connect.js";
import {
  createBooking,
  getBookingById,
  getAllBookings,
  getBookingsByPassengerEmail,
  updateBooking,
  deleteBooking,
} from "../models/bookings.js";
import { generateConfirmationCode } from "../includes/helpers.js";
import { ROLE_NAMES } from "../models/schemas/roles.js";

const bookingPage = async (req, res) => {
  try {
    const scheduleId = Number(req.params.scheduleId);

    if (!Number.isSafeInteger(scheduleId) || scheduleId <= 0) {
      return res.status(400).send("Invalid schedule ID");
    }

    const db = getDb();

    const schedule = await db.collection("schedules").findOne({
      id: scheduleId,
    });

    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    if (schedule.status !== true) {
      return res.status(400).send("This schedule is unavailable");
    }

    const trip = await db.collection("trips").findOne({
      id: schedule.tripId,
    });

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    const ticketClasses = await db
      .collection("ticketClasses")
      .find({})
      .toArray();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: trip.distance * ticketClass.pricePerKm,
      amenities: ticketClass.amenities,
      description: ticketClass.description,
    }));

    return res.render("trips/book", {
      title: "Book Trip",
      schedule,
      ticketOptions,
    });
  } catch (error) {
    console.error("Error loading booking page:", error);
    return res.status(500).send("Unable to load booking page");
  }
};

const processBookingRequest = async (req, res) => {
  const { scheduleId, ticketClass, selectedDay, passengers } = req.body;

  const parsedScheduleId = Number(scheduleId);

  if (!Number.isSafeInteger(parsedScheduleId) || parsedScheduleId <= 0) {
    return res.status(400).send("Invalid schedule ID");
  }

  const validTicketClasses = ["standard", "premium", "first"];

  if (!validTicketClasses.includes(ticketClass)) {
    return res.status(400).send("Invalid ticket class");
  }

  const validDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  if (!validDays.includes(selectedDay)) {
    return res.status(400).send("Invalid selected day");
  }

  if (
    !Array.isArray(passengers) ||
    passengers.length < 1 ||
    passengers.length > 8
  ) {
    return res.status(400).send("A booking requires 1 to 8 passengers");
  }

  for (const passenger of passengers) {
    if (
      !passenger ||
      typeof passenger !== "object" ||
      Array.isArray(passenger) ||
      ["firstName", "lastName", "email", "phone"].some(
        (field) =>
          typeof passenger[field] !== "string" || !passenger[field].trim(),
      )
    ) {
      return res.status(400).send("Invalid passenger information");
    }
  }

  try {
    const db = getDb();

    const schedule = await db.collection("schedules").findOne({
      id: parsedScheduleId,
    });

    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    if (schedule.status !== true) {
      return res.status(400).send("This schedule is unavailable");
    }

    if (
      !Array.isArray(schedule.daysOfWeek) ||
      !schedule.daysOfWeek.includes(selectedDay)
    ) {
      return res
        .status(400)
        .send("The selected day is not available for this schedule");
    }

    const ticketClassRecord = await db.collection("ticketClasses").findOne({
      class: ticketClass,
    });

    if (!ticketClassRecord) {
      return res.status(400).send("The selected ticket class is unavailable");
    }

    const bookingData = {
      id: generateConfirmationCode(),
      scheduleId: parsedScheduleId,
      tripId: schedule.tripId,
      ticketClass,
      selectedDay,
      passengers: passengers.map((passenger) => ({
        firstName: passenger.firstName.trim(),
        lastName: passenger.lastName.trim(),
        email: passenger.email.trim(),
        phone: passenger.phone.trim(),
      })),
    };

    let booking;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        booking = await createBooking(bookingData);
        break;
      } catch (error) {
        const duplicateBookingId =
          error.code === 11000 &&
          Object.prototype.hasOwnProperty.call(error.keyPattern ?? {}, "id");

        if (!duplicateBookingId || attempt === 2) {
          throw error;
        }

        bookingData.id = generateConfirmationCode();
      }
    }

    return res.redirect(`/trips/confirmation/${booking.id}`);
  } catch (error) {
    console.error("Error processing booking:", error);
    return res.status(500).send("Unable to process booking");
  }
};

const confirmationPage = async (req, res) => {
  try {
    const { confirmationId } = req.params;

    const booking = await getBookingById(confirmationId);

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    return res.render("trips/confirm", {
      title: "Trip Confirmation",
      confirmation: booking,
    });
  } catch (error) {
    console.error("Error loading booking confirmation:", error);
    return res.status(500).send("Unable to load booking confirmation");
  }
};

const getAllBookingsHandler = async (req, res) => {
  try {
    const isAdmin = req.user.role === ROLE_NAMES.ADMIN;
    const email = req.user.email;

    if (
      !isAdmin &&
      (req.user.role !== ROLE_NAMES.CUSTOMER ||
        typeof email !== "string" ||
        !email.trim())
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const bookings = isAdmin
      ? await getAllBookings()
      : await getBookingsByPassengerEmail(email);

    return res.status(200).json({
      bookings,
    });
  } catch (error) {
    console.error("Error retrieving bookings:", error);

    return res.status(500).json({
      message: "Unable to retrieve bookings",
    });
  }
};

const updateBookingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === ROLE_NAMES.ADMIN;
    const email = req.user.email;

    // Verify authorization.
    if (
      !isAdmin &&
      (req.user.role !== ROLE_NAMES.CUSTOMER ||
        typeof email !== "string" ||
        !email.trim())
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const passengerEmail = isAdmin ? null : email.trim().toLowerCase();

    // Retrieve the existing booking.
    const booking = await getBookingById(id);

    if (
      !booking ||
      (!isAdmin &&
        !booking.passengers.some(
          (passenger) => passenger.email === passengerEmail,
        ))
    ) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Validate the request body.
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Invalid request body",
      });
    }

    // Only allow specific fields to be updated.
    const allowedFields = ["ticketClass", "selectedDay", "passengers"];

    const fields = Object.keys(req.body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        message: "Invalid update fields",
      });
    }

    const updates = {};
    const db = getDb();

    // Validate ticket class.
    if (fields.includes("ticketClass")) {
      const { ticketClass } = req.body;

      const validTicketClasses = ["standard", "premium", "first"];

      if (!validTicketClasses.includes(ticketClass)) {
        return res.status(400).json({
          message: "Invalid ticket class",
        });
      }

      const ticketClassRecord = await db
        .collection("ticketClasses")
        .findOne({ class: ticketClass });

      if (!ticketClassRecord) {
        return res.status(400).json({
          message: "The selected ticket class is unavailable",
        });
      }

      updates.ticketClass = ticketClass;
    }

    // Validate the selected travel day.
    if (fields.includes("selectedDay")) {
      const { selectedDay } = req.body;

      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      if (!validDays.includes(selectedDay)) {
        return res.status(400).json({
          message: "Invalid selected day",
        });
      }

      const schedule = await db
        .collection("schedules")
        .findOne({ id: booking.scheduleId });

      if (
        !schedule ||
        schedule.status !== true ||
        !Array.isArray(schedule.daysOfWeek) ||
        !schedule.daysOfWeek.includes(selectedDay)
      ) {
        return res.status(400).json({
          message: "The selected day is unavailable",
        });
      }

      updates.selectedDay = selectedDay;
    }

    // Validate passenger information.
    if (fields.includes("passengers")) {
      const { passengers } = req.body;

      if (
        !Array.isArray(passengers) ||
        passengers.length < 1 ||
        passengers.length > 8
      ) {
        return res.status(400).json({
          message: "A booking requires 1 to 8 passengers",
        });
      }

      for (const passenger of passengers) {
        if (
          !passenger ||
          typeof passenger !== "object" ||
          Array.isArray(passenger) ||
          ["firstName", "lastName", "email", "phone"].some(
            (field) =>
              typeof passenger[field] !== "string" || !passenger[field].trim(),
          )
        ) {
          return res.status(400).json({
            message: "Invalid passenger information",
          });
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(passenger.email.trim())) {
          return res.status(400).json({
            message: "Invalid passenger email address",
          });
        }
      }

      updates.passengers = passengers.map((passenger) => ({
        firstName: passenger.firstName.trim(),
        lastName: passenger.lastName.trim(),
        email: passenger.email.trim().toLowerCase(),
        phone: passenger.phone.trim(),
      }));

      // Prevent customers from removing their own association.
      if (
        !isAdmin &&
        !updates.passengers.some(
          (passenger) => passenger.email === passengerEmail,
        )
      ) {
        return res.status(400).json({
          message: "Your email must remain associated with the booking",
        });
      }
    }

    // Update using the authorized database filter.
    const updatedBooking = await updateBooking(id, updates, passengerEmail);

    if (!updatedBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid booking data",
      });
    }

    console.error("Error updating booking:", error);

    return res.status(500).json({
      message: "Unable to update booking",
    });
  }
};

const deleteBookingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === ROLE_NAMES.ADMIN;

    const email = req.user.email;

    if (
      !isAdmin &&
      (req.user.role !== ROLE_NAMES.CUSTOMER ||
        typeof email !== "string" ||
        !email.trim())
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const deletedBooking = await deleteBooking(id, isAdmin ? null : email);

    if (!deletedBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);

    return res.status(500).json({
      message: "Unable to delete booking",
    });
  }
};

export {
  bookingPage,
  processBookingRequest,
  confirmationPage,
  getAllBookingsHandler,
  updateBookingHandler,
  deleteBookingHandler,
};

export const bookingsAdminPage = (req, res) => {
  return res.render("bookings", {
    title: "Bookings Administration",
  });
};
