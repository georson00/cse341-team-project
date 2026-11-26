import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };

const starterCollections = [
  ['trips', trips],
  ['schedules', schedules],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains]
];

// Roles used by authentication (see src/models/schemas/roles.js).
const standardRoles = ['customer', 'admin'];

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

// Preserve existing bookings when initializing the database.
const bookings = db.collection('bookings');
await bookings.createIndex({ id: 1 }, { unique: true });

  await seedRoles(db);

  // Users are preserved too; only make sure the unique indexes exist.
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ username: 1 }, { unique: true });
};

/**
 * Adds the standard roles without touching existing ones, so running
 * `npm run db:import` again never breaks the role references of existing users.
 */
const seedRoles = async (db) => {
  const roles = db.collection('roles');
  await roles.createIndex({ name: 1 }, { unique: true });

  for (const name of standardRoles) {
    await roles.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true }
    );
  }
};

export { initializeDatabase, starterCollections, standardRoles };
