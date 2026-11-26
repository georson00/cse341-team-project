import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

const connectionString = inject('MONGODB_TEST_URI');
// Use a dummy API key for automated tests only.
process.env.ADMIN_API_KEY = 'kizuna-test-admin-key';

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
});
