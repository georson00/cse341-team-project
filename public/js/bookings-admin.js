const statusElement = document.getElementById("status");
const table = document.getElementById("bookings-table");
const tableBody = document.getElementById("bookings-body");
const actionMessage = document.getElementById("action-message");
const editDialog = document.getElementById('edit-booking-dialog');
const editForm = document.getElementById('edit-booking-form');
const editBookingId = document.getElementById('edit-booking-id');
const editTicketClass = document.getElementById('edit-ticket-class');
const editSelectedDay = document.getElementById('edit-selected-day');
const editPassengers = document.getElementById('edit-passengers');
const addPassengerButton = document.getElementById('add-passenger-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const saveBookingButton = document.getElementById('save-booking-button');
const editError = document.getElementById('edit-error');

let currentBooking = null;
let isSaving = false;


const showMessage = (message, isError = false) => {
  actionMessage.textContent = message;

  actionMessage.classList.toggle("error", isError);
  actionMessage.classList.toggle("success", !isError);
};

const handleDelete = async (bookingId, button) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete booking ${bookingId}?`,
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;

  try {
    const response = await fetch(
      `/api/bookings/${encodeURIComponent(bookingId)}`,
      {
        method: "DELETE",
        credentials: "same-origin",
      },
    );

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to delete booking");
    }

    showMessage("Booking deleted successfully.");

    await loadBookings();
  } catch (error) {
    console.error("Failed to delete booking:", error);

    showMessage(error.message, true);
  } finally {
    button.disabled = false;
  }
};

const updatePassengerControls = () => {
    const groups = editPassengers.querySelectorAll('.passenger-fields');

    addPassengerButton.disabled = groups.length >= 8;

    groups.forEach((group, index) => {
        group.querySelector('legend').textContent =
            `Passenger ${index + 1}`;

        group.querySelector('.remove-passenger').disabled =
            groups.length <= 1;
    });
};

const addPassengerFields = (passenger = {}) => {
    if (editPassengers.children.length >= 8) {
        return;
    }

    const container = document.createElement('fieldset');
    container.className = 'passenger-fields';

    const legend = document.createElement('legend');
    container.appendChild(legend);

    const fields = [
        { name: 'firstName', label: 'First Name', type: 'text' },
        { name: 'lastName', label: 'Last Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' }
    ];

    for (const field of fields) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = field.label;

        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.name;
        input.value = passenger[field.name] ?? '';
        input.required = true;

        label.appendChild(input);
        group.appendChild(label);
        container.appendChild(group);
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove Passenger';
    removeButton.className =
        'action-button delete-button remove-passenger';

    removeButton.addEventListener('click', () => {
        if (editPassengers.children.length > 1) {
            container.remove();
            updatePassengerControls();
        }
    });

    container.appendChild(removeButton);
    editPassengers.appendChild(container);

    updatePassengerControls();
};
const openEditDialog = (booking) => {
    currentBooking = booking;

    editBookingId.textContent = booking.id;
    editTicketClass.value = booking.ticketClass;
    editSelectedDay.value = booking.selectedDay;

    editError.textContent = '';
    editPassengers.replaceChildren();

    for (const passenger of booking.passengers ?? []) {
        addPassengerFields(passenger);
    }

    if (editPassengers.children.length === 0) {
        addPassengerFields();
    }

    editDialog.showModal();
};

const loadBookings = async () => {
    statusElement.classList.remove('error');
  try {
    const response = await fetch("/api/bookings", {
      credentials: "same-origin",
    });

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (response.status === 403) {
      throw new Error("You are not authorized to access these bookings");
    }

    if (!response.ok) {
      throw new Error("Unable to retrieve bookings");
    }

    const data = await response.json();

    if (!Array.isArray(data.bookings)) {
      throw new Error("Unexpected API response");
    }

    tableBody.replaceChildren();

    if (data.bookings.length === 0) {
      table.hidden = true;
      statusElement.textContent = "No bookings found.";
      return;
    }

    for (const booking of data.bookings) {
      const row = document.createElement("tr");

      const values = [
        booking.id,
        booking.tripId,
        booking.scheduleId,
        booking.ticketClass,
        booking.selectedDay,
        booking.passengers?.length ?? 0,
        booking.createdAt
          ? new Date(booking.createdAt).toLocaleString()
          : "N/A",
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        row.appendChild(cell);
      }

      const actionsCell = document.createElement("td");

      const actionsContainer = document.createElement("div");
      actionsContainer.className = "actions";

      // Edit button
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.className = "action-button edit-button";
      editButton.addEventListener('click', () => {
    openEditDialog(booking);
});

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.className = "action-button delete-button";

      deleteButton.addEventListener("click", () => {
        handleDelete(booking.id, deleteButton);
      });

      actionsContainer.appendChild(editButton);
      actionsContainer.appendChild(deleteButton);

      actionsCell.appendChild(actionsContainer);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    }

    table.hidden = false;
    statusElement.textContent = `${data.bookings.length} booking(s) loaded successfully.`;
  } catch (error) {
    console.error("Failed to load bookings:", error);
    statusElement.textContent = "Unable to load bookings. Please try again.";
    statusElement.classList.add("error");
  }
};

addPassengerButton.addEventListener('click', () => {
    addPassengerFields();
});

cancelEditButton.addEventListener('click', () => {
    if (!isSaving) {
        editDialog.close();
    }
});

editDialog.addEventListener('cancel', (event) => {
    if (isSaving) {
        event.preventDefault();
    }
});

editDialog.addEventListener('close', () => {
    currentBooking = null;
    editError.textContent = '';
});

editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!currentBooking || isSaving) {
        return;
    }

    editError.textContent = '';

    const passengers = Array.from(
        editPassengers.querySelectorAll('.passenger-fields')
    ).map(group => ({
        firstName: group.querySelector('[name="firstName"]').value.trim(),
        lastName: group.querySelector('[name="lastName"]').value.trim(),
        email: group.querySelector('[name="email"]').value.trim().toLowerCase(),
        phone: group.querySelector('[name="phone"]').value.trim()
    }));

    const updates = {};

    if (editTicketClass.value !== currentBooking.ticketClass) {
        updates.ticketClass = editTicketClass.value;
    }

    if (editSelectedDay.value !== currentBooking.selectedDay) {
        updates.selectedDay = editSelectedDay.value;
    }

    const originalPassengers = currentBooking.passengers.map(passenger => ({
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email,
        phone: passenger.phone
    }));

    if (JSON.stringify(passengers) !==
        JSON.stringify(originalPassengers)) {
        updates.passengers = passengers;
    }

    if (Object.keys(updates).length === 0) {
        editError.textContent = 'No changes were made.';
        return;
    }

    isSaving = true;
    saveBookingButton.disabled = true;
    cancelEditButton.disabled = true;
    saveBookingButton.textContent = 'Saving...';

    try {
        const response = await fetch(
            `/api/bookings/${encodeURIComponent(currentBooking.id)}`,
            {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            }
        );

        if (response.status === 401) {
            window.location.assign('/login');
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to update booking'
            );
        }

        editDialog.close();

        showMessage('Booking updated successfully.');

        await loadBookings();

    } catch (error) {
        console.error('Failed to update booking:', error);
        editError.textContent = error.message;

    } finally {
        isSaving = false;
        saveBookingButton.disabled = false;
        cancelEditButton.disabled = false;
        saveBookingButton.textContent = 'Save Changes';
    }
});

loadBookings();
