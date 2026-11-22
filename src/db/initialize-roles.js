import Role from '../models/schemas/roles.js';

const standardRoles = [
  {
    name: 'admin',
    description: 'Administrator with full application access.'
  },
  {
    name: 'user',
    description: 'Standard authenticated application user.'
  }
];

export async function initializeRoles() {
  for (const roleData of standardRoles) {
    await Role.updateOne(
      { name: roleData.name },
      { $setOnInsert: roleData },
      { upsert: true }
    );
  }

  console.log('Standard roles initialized.');
}
