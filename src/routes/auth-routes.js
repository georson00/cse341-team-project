

import { Router } from 'express';

import {
  registerUser,
  loginUser,
  logoutUser
} from '../controllers/auth.js';

import {
  requirePageLogin,
  requirePageRole
} from '../middleware/auth.js';

const router = Router();

// Display authentication pages
router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/login', (req, res) => {
  res.render('login');
});

// Handle authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Admin dashboard
router.get(
  '/admin',
  requirePageLogin(),
  requirePageRole('admin'),
  (req, res) => {
    res.render('admin', {
      title: 'Admin Dashboard',
      user: req.session.user
    });
  }
);

export default router;
