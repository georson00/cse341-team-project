// src/models/schemas/roles.js
import mongoose from 'mongoose';

// The only roles the application understands. Public registration always
// assigns CUSTOMER; ADMIN is granted manually (see src/db/make-admin.js).
export const ROLE_NAMES = Object.freeze({
  CUSTOMER: 'customer',
  ADMIN: 'admin'
});

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: Object.values(ROLE_NAMES),
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  }
});

// Model "Role" maps to the "roles" collection (seeded by src/db/initialize.js).
const Role = mongoose.model('Role', roleSchema);

export default Role;
