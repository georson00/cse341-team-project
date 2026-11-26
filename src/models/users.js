// src/models/users.js
import bcrypt from 'bcrypt';
import User from './schemas/users.js';
import Role, { ROLE_NAMES } from './schemas/roles.js';

// bcrypt cost factor: high enough to slow down brute-force attacks,
// low enough to keep sign-in fast.
const SALT_ROUNDS = 12;

/**
 * Creates a new user with the customer role.
 * The role is always assigned here on the server, never taken from the form,
 * so nobody can register themselves as an admin.
 * Throws if the customer role has not been seeded (run `npm run db:import`).
 */
export async function createUser({ displayName, username, email, password }) {
  const customerRole = await Role.findOne({ name: ROLE_NAMES.CUSTOMER });

  if (!customerRole) {
    throw new Error('Customer role is missing. Run "npm run db:import".');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return User.create({
    displayName,
    username,
    email,
    passwordHash,
    role: customerRole._id
  });
}

// Returns the user with this email (with the role populated), or null.
export async function findUserByEmail(email) {
  return User.findOne({ email: String(email).trim().toLowerCase() }).populate('role');
}

// Returns the user with this username (with the role populated), or null.
export async function findUserByUsername(username) {
  return User.findOne({ username: String(username).trim().toLowerCase() }).populate('role');
}

// Looks a user up by email or username, whichever the sign-in form received.
export async function findUserByLogin(identifier) {
  return String(identifier).includes('@')
    ? findUserByEmail(identifier)
    : findUserByUsername(identifier);
}

// True when the plain-text password matches the stored bcrypt hash.
export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
