import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

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
