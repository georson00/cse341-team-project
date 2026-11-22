import User from './schemas/users.js';

export async function getUserById(id) {
  return User.findById(id).populate('role').lean();
}

export async function getUserByUsername(username) {
  return User.findOne({ username: username.toLowerCase() })
    .populate('role');
}

export async function getUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

export async function createUser(userData) {
  const user = new User(userData);
  return user.save();
}
