import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import {
    createBooking,
    getBookingById
} from '../src/models/bookings.js';

// Test account credentials.
const customer = {
    displayName: 'Jane Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    password: 'correct-horse-42',
    confirmPassword: 'correct-horse-42'
};

const admin = {
    displayName: 'Admin User',
    username: 'bookingadmin',
    email: 'admin@example.com',
    password: 'correct-horse-42',
    confirmPassword: 'correct-horse-42'
};

const otherCustomer = {
    displayName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'correct-horse-42',
    confirmPassword: 'correct-horse-42'
};

// Register and authenticate a test user.
const authenticate = async (user, isAdmin = false) => {
    const agent = request.agent(app);

    const registration = await agent
        .post('/register')
        .type('form')
        .send(user);

    expect(registration.status).toBe(302);
    expect(registration.headers.location)
        .toBe('/login?registered=1');

    if (isAdmin) {
        const db = getDb();

        const adminRole = await db
            .collection('roles')
            .findOne({ name: 'admin' });

        await db.collection('users').updateOne(
            { email: user.email },
            { $set: { role: adminRole._id } }
        );
    }

    const login = await agent
        .post('/login')
        .type('form')
        .send({
            login: user.email,
            password: user.password
        });

    expect(login.status).toBe(302);

    const me = await agent.get('/api/auth/me');

    expect(me.status).toBe(200);
    expect(me.body.user.role)
        .toBe(isAdmin ? 'admin' : 'customer');

    return agent;
};

// Create predictable booking fixtures.
const seedBookings = async () => {
    await createBooking({
        id: 'API-TEST-001',
        scheduleId: 1,
        tripId: 'test-trip',
        ticketClass: 'standard',
        selectedDay: 'monday',
        passengers: [
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: customer.email,
                phone: '5551234567'
            }
        ]
    });

    await createBooking({
        id: 'API-TEST-002',
        scheduleId: 1,
        tripId: 'test-trip',
        ticketClass: 'standard',
        selectedDay: 'monday',
        passengers: [
            {
                firstName: 'Alex',
                lastName: 'Brown',
                email: 'alex@example.com',
                phone: '5559876543'
            }
        ]
    });
};


/* =========================================
 * Protected booking page
 * ========================================= */

describe('GET /bookings-admin', () => {
    test('redirects unauthenticated visitors to login', async () => {
        const response = await request(app)
            .get('/bookings-admin');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/login');
    });

    test('allows authenticated customers', async () => {
        const agent = await authenticate(customer);

        const response = await agent.get('/bookings-admin');

        expect(response.status).toBe(200);
        expect(response.text)
            .toContain('Bookings Administration');
    });

    test('allows authenticated administrators', async () => {
        const agent = await authenticate(admin, true);

        const response = await agent.get('/bookings-admin');

        expect(response.status).toBe(200);
    });

    test('includes a booking management link on the admin dashboard', async () => {
        const agent = await authenticate(admin, true);

        const response = await agent.get('/admin/dashboard');

        expect(response.status).toBe(200);
        expect(response.text).toContain('/bookings-admin');
    });
});


/* =========================================
 * Retrieve bookings
 * ========================================= */

describe('GET /api/bookings', () => {
    test('rejects unauthenticated requests', async () => {
        const response = await request(app)
            .get('/api/bookings');

        expect(response.status).toBe(401);
        expect(response.body).not.toHaveProperty('bookings');
    });

    test('rejects legacy API key authentication', async () => {
        const response = await request(app)
            .get('/api/bookings')
            .set('x-admin-api-key', 'kizuna-test-admin-key');

        expect(response.status).toBe(401);
    });

    test('allows administrators to retrieve all bookings', async () => {
        await seedBookings();

        const agent = await authenticate(admin, true);

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(2);

        expect(
            response.body.bookings.map(booking => booking.id)
        ).toEqual(expect.arrayContaining([
            'API-TEST-001',
            'API-TEST-002'
        ]));
    });

    test('returns only bookings associated with the customer', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0].id)
            .toBe('API-TEST-001');
    });

    test('returns an empty array for customers without bookings', async () => {
        await seedBookings();

        const agent = await authenticate(otherCustomer);

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toEqual([]);
    });

    test('revokes booking access after logout', async () => {
        const agent = await authenticate(customer);

        expect(
            (await agent.get('/api/bookings')).status
        ).toBe(200);

        const logout = await agent.post('/logout');

        expect(logout.status).toBe(302);
        expect(logout.headers.location).toBe('/login');

        expect(
            (await agent.get('/api/bookings')).status
        ).toBe(401);
    });
});


/* =========================================
 * Update bookings
 * ========================================= */

describe('PATCH /api/bookings/:id', () => {
    test('rejects unauthenticated requests', async () => {
        await seedBookings();

        const response = await request(app)
            .patch('/api/bookings/API-TEST-001')
            .send({ ticketClass: 'premium' });

        expect(response.status).toBe(401);
    });

    test('allows administrators to update any booking', async () => {
        await seedBookings();

        const agent = await authenticate(admin, true);

        const response = await agent
            .patch('/api/bookings/API-TEST-002')
            .send({ ticketClass: 'premium' });

        expect(response.status).toBe(200);
        expect(response.body.booking.ticketClass)
            .toBe('premium');

        const booking = await getBookingById('API-TEST-002');

        expect(booking.ticketClass).toBe('premium');
    });

    test('allows customers to update their own bookings', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({ ticketClass: 'premium' });

        expect(response.status).toBe(200);

        const booking = await getBookingById('API-TEST-001');

        expect(booking.ticketClass).toBe('premium');
    });

    test('prevents customers from updating another booking', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-002')
            .send({ ticketClass: 'premium' });

        expect(response.status).toBe(404);

        const booking = await getBookingById('API-TEST-002');

        expect(booking.ticketClass).toBe('standard');
    });

    test('rejects invalid ticket classes', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({ ticketClass: 'invalid-class' });

        expect(response.status).toBe(400);
    });

    test('rejects changes to protected fields', async () => {
        await seedBookings();

        const agent = await authenticate(admin, true);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({ scheduleId: 999 });

        expect(response.status).toBe(400);

        const booking = await getBookingById('API-TEST-001');

        expect(booking.scheduleId).toBe(1);
    });

    test('rejects an empty passenger list', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({ passengers: [] });

        expect(response.status).toBe(400);
    });

    test('rejects an empty update request', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({});

        expect(response.status).toBe(400);
    });

    test('allows customers to update passenger information', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({
                passengers: [
                    {
                        firstName: 'Jane',
                        lastName: 'Smith',
                        email: customer.email,
                        phone: '5550001234'
                    }
                ]
            });

        expect(response.status).toBe(200);

        const booking = await getBookingById('API-TEST-001');

        expect(booking.passengers[0].phone)
            .toBe('5550001234');
    });

    test('prevents customers from removing their email association', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .patch('/api/bookings/API-TEST-001')
            .send({
                passengers: [
                    {
                        firstName: 'Someone',
                        lastName: 'Else',
                        email: 'someone@example.com',
                        phone: '5551234567'
                    }
                ]
            });

        expect(response.status).toBe(400);

        const booking = await getBookingById('API-TEST-001');

        expect(booking.passengers[0].email)
            .toBe(customer.email);
    });

    test('returns 404 for a nonexistent booking', async () => {
        const agent = await authenticate(admin, true);

        const response = await agent
            .patch('/api/bookings/DOES-NOT-EXIST')
            .send({ ticketClass: 'premium' });

        expect(response.status).toBe(404);
    });
});


/* =========================================
 * Delete bookings
 * ========================================= */

describe('DELETE /api/bookings/:id', () => {
    test('rejects unauthenticated requests', async () => {
        await seedBookings();

        const response = await request(app)
            .delete('/api/bookings/API-TEST-001');

        expect(response.status).toBe(401);
    });

    test('allows administrators to delete any booking', async () => {
        await seedBookings();

        const agent = await authenticate(admin, true);

        const response = await agent
            .delete('/api/bookings/API-TEST-002');

        expect(response.status).toBe(200);

        expect(
            await getBookingById('API-TEST-002')
        ).toBeNull();
    });

    test('allows customers to delete their own bookings', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .delete('/api/bookings/API-TEST-001');

        expect(response.status).toBe(200);

        expect(
            await getBookingById('API-TEST-001')
        ).toBeNull();
    });

    test('prevents customers from deleting another booking', async () => {
        await seedBookings();

        const agent = await authenticate(customer);

        const response = await agent
            .delete('/api/bookings/API-TEST-002');

        expect(response.status).toBe(404);

        expect(
            await getBookingById('API-TEST-002')
        ).not.toBeNull();
    });

    test('returns 404 for a nonexistent booking', async () => {
        const agent = await authenticate(admin, true);

        const response = await agent
            .delete('/api/bookings/DOES-NOT-EXIST');

        expect(response.status).toBe(404);
    });
});