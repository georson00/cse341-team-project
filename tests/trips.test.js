import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trips', () => {
  test('returns all starter trips as JSON', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.trips).toBeInstanceOf(Array);
    expect(response.body.trips).toHaveLength(6);
    expect(response.body.trips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express',
          region: 'central'
        })
      ])
    );
  });
});

// Adds `count` extra trips so there is more than one page of results.
// Names are zero-padded ("Test Trip 01") so they sort in a predictable order.
const addTestTrips = async (count) => {
  const trips = Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return {
      id: `test-trip-${number}`,
      name: `Test Trip ${number}`,
      description: 'Extra trip used by the pagination tests.',
      region: 'central',
      bestSeason: 'summer'
    };
  });
  await getDb().collection('trips').insertMany(trips);
};

describe('GET /api/trips pagination', () => {
  test('defaults to page 1 with 10 trips per page and returns metadata', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 6,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  });

  test('splits more than 10 trips into pages sorted by name, without overlap', async () => {
    await addTestTrips(15); // 6 starter trips + 15 = 21 trips -> 3 pages

    const page1 = await request(app).get('/api/trips?page=1');
    const page2 = await request(app).get('/api/trips?page=2');
    const page3 = await request(app).get('/api/trips?page=3');

    expect(page1.body.trips).toHaveLength(10);
    expect(page2.body.trips).toHaveLength(10);
    expect(page3.body.trips).toHaveLength(1);

    expect(page2.body.pagination).toEqual({
      page: 2,
      limit: 10,
      totalItems: 21,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true
    });

    const names = [...page1.body.trips, ...page2.body.trips, ...page3.body.trips].map((trip) => trip.name);
    expect(new Set(names).size).toBe(21);
    expect(names).toEqual([...names].sort());
  });

  test('honors a custom limit', async () => {
    await addTestTrips(15);

    const all = await request(app).get('/api/trips?limit=50');
    const response = await request(app).get('/api/trips?limit=5&page=2');

    expect(response.status).toBe(200);
    expect(response.body.trips.map((trip) => trip.id)).toEqual(
      all.body.trips.slice(5, 10).map((trip) => trip.id)
    );
    expect(response.body.pagination).toMatchObject({ page: 2, limit: 5, totalPages: 5 });
  });

  test('returns an empty page with real metadata when the page is past the end', async () => {
    const response = await request(app).get('/api/trips?page=9');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
    expect(response.body.pagination).toMatchObject({
      page: 9,
      totalItems: 6,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: true
    });
  });

  test.each([
    ['page=0', 'page must be an integer of at least 1'],
    ['page=-1', 'page must be an integer of at least 1'],
    ['page=abc', 'page must be an integer of at least 1'],
    ['page=1.5', 'page must be an integer of at least 1'],
    ['page=1&page=2', 'page must be an integer of at least 1'],
    ['limit=0', 'limit must be an integer between 1 and 50'],
    ['limit=51', 'limit must be an integer between 1 and 50'],
    ['limit=ten', 'limit must be an integer between 1 and 50']
  ])('rejects ?%s with a 400', async (query, message) => {
    const response = await request(app).get(`/api/trips?${query}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid query parameters', details: [message] });
  });

  test('lists every invalid parameter at once', async () => {
    const response = await request(app).get('/api/trips?page=0&limit=100');

    expect(response.status).toBe(400);
    expect(response.body.details).toHaveLength(2);
  });
});

describe('GET /api/trips/:id', () => {
  test('returns one trip by ID', async () => {
    const response = await request(app).get('/api/trips/sakura-valley');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 'sakura-valley', bestSeason: 'spring' });
  });

  test('returns 404 for an unknown trip', async () => {
    const response = await request(app).get('/api/trips/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
  });
});

describe('Trip pages', () => {
  test('GET /trips renders the list shell without server-rendered cards', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="trip-card-template"');
    expect(response.text).not.toContain('Alpine Panorama Express');
    expect(response.text).toContain('id="trips-pagination"');
  });

  test('GET /trips/:tripId renders the details page', async () => {
    const response = await request(app).get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Alpine Panorama Express');
  });

  test('GET /trips/:tripId returns the 404 page for an unknown trip', async () => {
    const response = await request(app).get('/trips/does-not-exist');

    expect(response.status).toBe(404);
  });
});

describe('Trip admin API stays protected', () => {
  test('the public list works signed out, but changes require an admin', async () => {
    const list = await request(app).get('/api/trips');
    const create = await request(app).post('/api/trips').send({ name: 'Test Trip' });
    const update = await request(app).put('/api/trips/665f1c2e9b1e8a0012345678').send({ name: 'x' });
    const remove = await request(app).delete('/api/trips/665f1c2e9b1e8a0012345678');

    expect(list.status).toBe(200);
    expect(create.status).toBe(401);
    expect(update.status).toBe(401);
    expect(remove.status).toBe(401);
  });

  test('the trip admin page redirects signed-out visitors to login', async () => {
    const response = await request(app).get('/admin/trips');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });
});
