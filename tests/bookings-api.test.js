import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createBooking } from '../src/models/bookings.js';


describe('GET /api/bookings', () => {
    test('rejects requests without admin authentication', async () => {
        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(401);
        expect(response.body).not.toHaveProperty('bookings');
    });
    test('rejects requests with an invalid admin API key', async () => {
    const response = await request(app)
        .get('/api/bookings')
        .set('x-admin-api-key', 'incorrect-test-key');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
        message: 'Invalid admin API key'
    });
    expect(response.body).not.toHaveProperty('bookings');
});
test('returns bookings when a valid admin API key is provided', async () => {
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
                email: 'jane@example.com',
                phone: '5551234567'
            }
        ]
    });

    const response = await request(app)
        .get('/api/bookings')
        .set('x-admin-api-key', 'kizuna-test-admin-key');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    expect(response.body).toHaveProperty('bookings');
    expect(response.body.bookings).toBeInstanceOf(Array);
    expect(response.body.bookings).toHaveLength(1);

    expect(response.body.bookings[0]).toMatchObject({
        id: 'API-TEST-001',
        scheduleId: 1,
        tripId: 'test-trip',
        ticketClass: 'standard',
        selectedDay: 'monday'
    });

    expect(response.body.bookings[0].passengers[0].firstName).toBe('Jane');
});
test('allows an authenticated admin session to retrieve bookings', async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
        .post('/admin/login')
        .type('form')
        .send({
            adminKey: 'kizuna-test-admin-key'
        });

    expect(loginResponse.status).toBe(302);
    expect(loginResponse.headers.location).toBe('/bookings-admin');

    const response = await agent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bookings');
    expect(response.body.bookings).toBeInstanceOf(Array);
});
test('revokes booking API access after admin logout', async () => {
    const agent = request.agent(app);

    // Log in as an administrator.
    const loginResponse = await agent
        .post('/admin/login')
        .type('form')
        .send({
            adminKey: 'kizuna-test-admin-key'
        });

    expect(loginResponse.status).toBe(302);

    // Verify access before logout.
    const beforeLogout = await agent.get('/api/bookings');

    expect(beforeLogout.status).toBe(200);

    // Log out.
    const logoutResponse = await agent.post('/admin/logout');

    expect(logoutResponse.status).toBe(302);
    expect(logoutResponse.headers.location).toBe('/admin/login');

    // Attempt to access the API using the same agent.
    const afterLogout = await agent.get('/api/bookings');

    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body).not.toHaveProperty('bookings');
});
});