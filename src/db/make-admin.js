// src/db/make-admin.js
// Gives an existing user the admin role.
// Usage: npm run db:make-admin -- someone@example.com
import { closeDb, connectToDb } from './connect.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run db:make-admin -- <email>');
  process.exit(1);
}

try {
  const db = await connectToDb();
  const adminRole = await db.collection('roles').findOne({ name: 'admin' });

  if (!adminRole) {
    throw new Error('Admin role is missing. Run "npm run db:import" first.');
  }

  const result = await db.collection('users').updateOne(
    { email },
    { $set: { role: adminRole._id } }
  );

  if (result.matchedCount === 0) {
    console.error(`No user found with email ${email}. Register first at /register.`);
    process.exitCode = 1;
  } else {
    console.log(`${email} is now an admin. Sign out and back in to refresh the session.`);
  }
} finally {
  await closeDb();
}
