import { describe, expect, test, vi } from 'vitest';import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import Booking from '../src/models/schemas/bookings.js';


describe('Customer booking flow', () => {
    test('creates a booking and redirects to its confirmation page', async () => {
        const db = getDb();

        // Use an available schedule from the seeded test database.
        const schedule = await db.collection('schedules').findOne({
            status: true,
            daysOfWeek: { $in: ['monday'] }
        });

        expect(schedule).not.toBeNull();

        const response = await request(app)
            .post('/trips/book')
            .type('form')
            .send({
    scheduleId: String(schedule.id),
    ticketClass: 'standard',
    selectedDay: 'monday',
    'passengers[0][firstName]': 'Jane',
    'passengers[0][lastName]': 'Smith',
    'passengers[0][email]': 'jane@example.com',
    'passengers[0][phone]': '5551234567'
});
        expect(response.status).toBe(302);
        expect(response.headers.location).toMatch(
            /^\/trips\/confirmation\/.+$/
        );

        const booking = await db.collection('bookings').findOne({
            scheduleId: schedule.id
        });

        expect(booking).not.toBeNull();
        expect(booking.tripId).toBe(schedule.tripId);
        expect(booking.ticketClass).toBe('standard');
        expect(booking.selectedDay).toBe('monday');
        expect(booking.passengers[0].firstName).toBe('Jane');

        expect(response.headers.location).toBe(
            `/trips/confirmation/${booking.id}`
        );
        // Follow the redirect to the confirmation page.
const confirmationResponse = await request(app)
    .get(response.headers.location);

expect(confirmationResponse.status).toBe(200);
expect(confirmationResponse.headers['content-type']).toContain('text/html');

// Verify that the confirmation page displays the booking.
expect(confirmationResponse.text).toContain(booking.id);
expect(confirmationResponse.text).toContain('Jane');
expect(confirmationResponse.text).toContain('Smith');
    });
    test('rejects a booking with an invalid ticket class', async () => {
    const db = getDb();

    const schedule = await db.collection('schedules').findOne({
        status: true,
        daysOfWeek: { $in: ['monday'] }
    });

    expect(schedule).not.toBeNull();

    const response = await request(app)
        .post('/trips/book')
        .type('form')
        .send({
            scheduleId: String(schedule.id),
            ticketClass: 'vip',
            selectedDay: 'monday',
            'passengers[0][firstName]': 'Jane',
            'passengers[0][lastName]': 'Smith',
            'passengers[0][email]': 'jane@example.com',
            'passengers[0][phone]': '5551234567'
        });

    expect(response.status).toBe(400);
    expect(response.text).toContain('Invalid ticket class');

    // Invalid submissions must not create booking records.
    const bookingCount = await db.collection('bookings').countDocuments();

    expect(bookingCount).toBe(0);
});
test('retries when a generated booking ID already exists', async () => {
    const db = getDb();

    const schedule = await db.collection('schedules').findOne({
        status: true,
        daysOfWeek: { $in: ['monday'] }
    });

    expect(schedule).not.toBeNull();

    const duplicateError = new Error('Duplicate booking ID');
    duplicateError.code = 11000;
    duplicateError.keyPattern = { id: 1 };

    const originalSave = Booking.prototype.save;
    const attemptedIds = [];

   const saveSpy = vi.spyOn(Booking.prototype, 'save')
    .mockImplementationOnce(function () {
        attemptedIds.push(this.id);
        return Promise.reject(duplicateError);
    })
    .mockImplementation(function (...args) {
        attemptedIds.push(this.id);
        return originalSave.apply(this, args);
    });

    try {
        const response = await request(app)
            .post('/trips/book')
            .type('form')
            .send({
                scheduleId: String(schedule.id),
                ticketClass: 'standard',
                selectedDay: 'monday',
                'passengers[0][firstName]': 'John',
                'passengers[0][lastName]': 'Doe',
                'passengers[0][email]': 'john@example.com',
                'passengers[0][phone]': '5551234567'
            });

        expect(response.status).toBe(302);
        expect(saveSpy).toHaveBeenCalledTimes(2);
        expect(attemptedIds).toHaveLength(2);
        expect(attemptedIds[1]).not.toBe(attemptedIds[0]);

        const bookings = await db.collection('bookings')
            .find({})
            .toArray();

        expect(bookings).toHaveLength(1);
        expect(bookings[0].passengers[0].firstName).toBe('John');

        expect(response.headers.location).toBe(
            `/trips/confirmation/${bookings[0].id}`
        );
    } finally {
        saveSpy.mockRestore();
    }
});

});