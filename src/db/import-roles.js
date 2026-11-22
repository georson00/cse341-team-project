import { closeDb, connectToDb } from './connect.js';
import { initializeRoles } from './initialize-roles.js';

try {
  await connectToDb();
  await initializeRoles();
  console.log('Role import complete.');
} catch (error) {
  console.error('Role import failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeDb();
}
