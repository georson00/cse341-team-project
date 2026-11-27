// src/controllers/auth.js
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserByLogin,
  verifyPassword
} from '../models/users.js';
import { ROLE_NAMES } from '../models/schemas/roles.js';

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Where each role lands after signing in.
// (Feature Set 2 will point customers to their user dashboard.)
const homeForRole = (role) => (role === ROLE_NAMES.ADMIN ? '/admin/dashboard' : '/');

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

/* =========================================================================
 * Validation
 * ========================================================================= */

// Returns the cleaned form values and a list of error messages.
function validateRegistration(body = {}) {
  const values = {
    displayName: asText(body.displayName),
    username: asText(body.username).toLowerCase(),
    email: asText(body.email).toLowerCase()
  };
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
  const errors = [];

  if (!values.displayName || values.displayName.length > 60) {
    errors.push('Display name is required (60 characters max).');
  }
  if (!USERNAME_PATTERN.test(values.username)) {
    errors.push('Username must be 3-30 characters: letters, numbers, dots, dashes or underscores.');
  }
  if (!EMAIL_PATTERN.test(values.email)) {
    errors.push('Please enter a valid email address.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return { values, password, errors };
}

/* =========================================================================
 * Session helpers
 * ========================================================================= */

/**
 * Starts a fresh session for the user. regenerate() issues a new session ID,
 * which prevents session fixation. Only safe, non-secret fields are stored.
 */
function signIn(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);

      const role = user.role?.name || ROLE_NAMES.CUSTOMER;

      req.session.user = {
        id: user._id.toString(),
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        role
      };
      // Keeps the existing /bookings-admin page (Feature Set 3) working for
      // admin users until it switches to requirePageRole('admin').
      req.session.isAdmin = role === ROLE_NAMES.ADMIN;

      return req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
  });
}

/* =========================================================================
 * Page controllers
 * ========================================================================= */

// GET /register
export function registerPage(req, res) {
  if (req.user) return res.redirect(homeForRole(req.user.role));
  return res.render('auth/register', { title: 'Create an Account', errors: [], values: {} });
}

// POST /register
export async function register(req, res, next) {
  const { values, password, errors } = validateRegistration(req.body);

  const renderForm = (status, messages) =>
    res.status(status).render('auth/register', {
      title: 'Create an Account',
      errors: messages,
      values
    });

  if (errors.length > 0) {
    return renderForm(400, errors);
  }

  try {
    // Friendly duplicate checks; the unique indexes are the final safeguard.
    if (await findUserByEmail(values.email)) {
      return renderForm(409, ['An account with that email already exists.']);
    }
    if (await findUserByUsername(values.username)) {
      return renderForm(409, ['That username is already taken.']);
    }

    await createUser({ ...values, password });

    return res.redirect('/login?registered=1');
  } catch (error) {
    // 11000 = duplicate key (two sign-ups with the same email at the same time).
    if (error?.code === 11000) {
      return renderForm(409, ['An account with that email or username already exists.']);
    }
    return next(error);
  }
}

// GET /login
export function loginPage(req, res) {
  if (req.user) return res.redirect(homeForRole(req.user.role));
  return res.render('auth/login', {
    title: 'Sign In',
    error: null,
    registered: req.query.registered === '1',
    login: ''
  });
}

// POST /login
export async function login(req, res, next) {
  const login = asText(req.body?.login);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const renderForm = (status, error) =>
    res.status(status).render('auth/login', { title: 'Sign In', error, registered: false, login });

  if (!login || !password) {
    return renderForm(400, 'Please enter your email or username and your password.');
  }

  try {
    const user = await findUserByLogin(login);
    const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

    // Same message for "no such user" and "wrong password" so the form
    // does not reveal which emails are registered.
    if (!passwordMatches) {
      return renderForm(401, 'Invalid email/username or password.');
    }

    await signIn(req, user);

    return res.redirect(homeForRole(req.session.user.role));
  } catch (error) {
    return next(error);
  }
}

// POST /logout
export function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('kizuna.sid', { path: '/' });
    return res.redirect('/login');
  });
}

// GET /admin/dashboard (protected with requirePageRole('admin'))
export function adminDashboardPage(req, res) {
  return res.render('admin/dashboard', { title: 'Admin Dashboard' });
}

/* =========================================================================
 * API controllers
 * ========================================================================= */

// GET /api/auth/me (protected with requireApiLogin)
export function getCurrentUser(req, res) {
  return res.status(200).json({ user: req.user });
}
