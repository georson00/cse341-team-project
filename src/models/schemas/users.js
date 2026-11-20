// src/models/schemas/users.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Name shown in the UI, e.g. "Jane Smith".
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    // Unique handle the user can sign in with, e.g. "jsmith".
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._-]+$/
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    // bcrypt hash. The plain-text password is never stored.
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    }
  },
  {
    timestamps: true,
    // Never leak the password hash if a user document is sent as JSON.
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

// Model "User" maps to the "users" collection.
const User = mongoose.model('User', userSchema);

export default User;
