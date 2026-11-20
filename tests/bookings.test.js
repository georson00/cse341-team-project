import { describe, expect, test } from 'vitest';
import {
    createBooking,
    getBookingById,
    getAllBookings
} from '../src/models/bookings.js';

describe('Booking model', () => {
    test('rejects a booking with no passengers', async () => {
    const invalidBooking = {
        id: 'INVALID001',
        scheduleId: 1,
        tripId: 'test-trip',
        ticketClass: 'standard',
        selectedDay: 'monday',
        passengers: []
    };

    await expect(
        createBooking(invalidBooking)
    ).rejects.toThrow();
});
    test('creates a booking and retrieves it by ID', async () => {
        const bookingData = {
            id: 'TESTBOOK001',
            scheduleId: 1,
            tripId: 'test-trip',
            ticketClass: 'standard',
            selectedDay: 'monday',
            passengers: [
                {
                    firstName: 'John',
                    lastName: 'Smith',
                    email: 'john@example.com',
                    phone: '5551234567'
                }
            ]
        };

        const created = await createBooking(bookingData);

        expect(created.id).toBe('TESTBOOK001');

        const retrieved = await getBookingById('TESTBOOK001');

        expect(retrieved).not.toBeNull();
        expect(retrieved.id).toBe('TESTBOOK001');
        expect(retrieved.scheduleId).toBe(1);
        expect(retrieved.passengers).toHaveLength(1);
        expect(retrieved.passengers[0].firstName).toBe('John');
    });

    test('retrieves all bookings', async () => {
    const bookingData = {
        scheduleId: 1,
        tripId: 'test-trip',
        ticketClass: 'standard',
        selectedDay: 'monday',
        passengers: [
            {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@example.com',
                phone: '5551234567'
            }
        ]
    };

    await createBooking({
        ...bookingData,
        id: 'TESTBOOK001'
    });

    await createBooking({
        ...bookingData,
        id: 'TESTBOOK002'
    });

    const bookings = await getAllBookings();

    expect(bookings).toHaveLength(2);

    expect(bookings.map((booking) => booking.id)).toEqual(
        expect.arrayContaining([
            'TESTBOOK001',
            'TESTBOOK002'
        ])
      );
});

test('returns null when a booking does not exist', async () => {
    const booking = await getBookingById('NONEXISTENT001');

    expect(booking).toBeNull();
});

});