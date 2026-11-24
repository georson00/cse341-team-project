// src/middleware/auth.js
//
// Team conventions (Feature Set 1: Core Authentication):
// - After sign-in, the session stores a small user object in req.session.user:
//     { id, displayName, username, email, role }   // role: 'customer' | 'admin'
// - loadSessionUser copies it to req.user (for controllers and middleware)
//   and to res.locals.user (for EJS templates). It is null when signed out.
// - API guards return JSON:   401 { message: 'Authentication required' }
//                             403 { message: 'Forbidden' }
// - Page guards redirect to /login when signed out and render the
//   errors/403 page when the user does not have the required role.

/**
 * Not a guard: makes the signed-in user (or null) available to every
 * route and template. Register it after the session middleware.
 */
export const loadSessionUser = (req, res, next) => {
  req.user = req.session?.user || null;
  res.locals.user = req.user;
  next();
};

const isLoggedIn = (req) => Boolean(req.user);
const hasRole = (req, role) => req.user?.role === role;

// API guard: 401 JSON when signed out.
export const requireApiLogin = (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  return next();
};

// Page guard: redirect to the login page when signed out.
export const requirePageLogin = (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/login');
  }
  return next();
};

// API guard: 401 JSON when signed out, 403 JSON when the role does not match.
export const requireApiRole = (role) => (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!hasRole(req, role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};

// Page guard: redirect to /login when signed out, 403 page when the role does not match.
export const requirePageRole = (role) => (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/login');
  }
  if (!hasRole(req, role)) {
    return res.status(403).render('errors/403', { title: 'Access Denied' });
  }
  return next();
};
