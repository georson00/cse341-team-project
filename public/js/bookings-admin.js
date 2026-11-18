
const statusElement = document.getElementById('status');
const table = document.getElementById('bookings-table');
const tableBody = document.getElementById('bookings-body');

const loadBookings = async () => {
    try {
        const response = await fetch('/api/bookings', {
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.assign('/admin/login');
            return;
        }

        if (!response.ok) {
            throw new Error('Unable to retrieve bookings');
        }

        const data = await response.json();

        if (!Array.isArray(data.bookings)) {
            throw new Error('Unexpected API response');
        }

        tableBody.replaceChildren();

        if (data.bookings.length === 0) {
            statusElement.textContent = 'No bookings found.';
            return;
        }

        for (const booking of data.bookings) {
            const row = document.createElement('tr');

            const values = [
                booking.id,
                booking.tripId,
                booking.scheduleId,
                booking.ticketClass,
                booking.selectedDay,
                booking.passengers?.length ?? 0,
                booking.createdAt
                    ? new Date(booking.createdAt).toLocaleString()
                    : 'N/A'
            ];

            for (const value of values) {
                const cell = document.createElement('td');
                cell.textContent = String(value ?? '');
                row.appendChild(cell);
            }

            tableBody.appendChild(row);
        }

        table.hidden = false;
        statusElement.textContent =
            `${data.bookings.length} booking(s) loaded successfully.`;
    } catch (error) {
        console.error('Failed to load bookings:', error);
        statusElement.textContent =
            'Unable to load bookings. Please try again.';
        statusElement.classList.add('error');
    }
};

loadBookings();
