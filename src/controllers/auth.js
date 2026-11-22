
import bcrypt from 'bcryptjs';
import {
  getUserByUsername,
  createUser
} from '../models/users.js';
import { getRoleByName } from '../models/roles.js';

export const registerUser = async (req, res) => {
  try {
    const { displayName, username, email, password } = req.body;

    if (!displayName || !username || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters.'
      });
    }

    const existingUser = await getUserByUsername(username);

    if (existingUser) {
      return res.status(409).json({
        message: 'Username is already taken.'
      });
    }

    const userRole = await getRoleByName('user');

    if (!userRole) {
      return res.status(500).json({
        message: 'Default user role is not configured.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await createUser({
      displayName,
      username,
      email,
      passwordHash,
      role: userRole._id
    });

    return res.status(201).json({
      message: 'Registration successful.'
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Username or email is already registered.'
      });
    }

    return res.status(500).json({
      message: 'Unable to register user.'
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required.'
      });
    }

    const user = await getUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        message: 'Invalid username or password.'
      });
    }

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      role: user.role.name
    };

    return res.status(200).json({
      message: 'Login successful.',
      user: req.session.user
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Unable to log in.'
    });
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);

      return res.status(500).json({
        message: 'Unable to log out.'
      });
    }

    res.clearCookie('connect.sid');

    return res.status(200).json({
      message: 'Logout successful.'
    });
  });
};
