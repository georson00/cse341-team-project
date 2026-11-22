import Role from './schemas/roles.js';

export async function getRoleByName(name) {
  return Role.findOne({ name: name.toLowerCase() });
}

export async function getAllRoles() {
  return Role.find({}).lean();
}

export async function createRole(roleData) {
  const role = new Role(roleData);
  return role.save();
}
