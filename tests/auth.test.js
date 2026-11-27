import { describe, expect, test } from 'vitest';
import express from 'express';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import {
  requireApiLogin,
  requireApiRole,
  requirePageLogin
} from '../src/middleware/auth.js';

const newUser = {
  displayName: 'Jane Smith',
  username: 'jsmith',
  email: 'jane@example.com',
  password: 'correct-horse-42',
  confirmPassword: 'correct-horse-42'
};

const register = (agent, overrides = {}) =>
  agent.post('/register').type('form').send({ ...newUser, ...overrides });

const signIn = (agent, login = newUser.email, password = newUser.password) =>
  agent.post('/login').type('form').send({ login, password });

const makeAdmin = async (email) => {
  const db = getDb();
  const adminRole = await db.collection('roles').findOne({ name: 'admin' });
  await db.collection('users').updateOne({ email }, { $set: { role: adminRole._id } });
};

// A tiny app that applies the guards with a fake session user, so each guard
// can be checked on its own without going through the login form.
const guardedApp = (sessionUser, ...guards) => {
  const testApp = express();
  testApp.use((req, res, next) => {
    req.user = sessionUser;
    next();
  });
  testApp.get('/guarded', ...guards, (req, res) => res.status(200).json({ ok: true }));
  return testApp;
};

describe('Database import', () => {
  test('seeds the customer and admin roles', async () => {
    const roles = await getDb().collection('roles').find().toArray();
    expect(roles.map((role) => role.name).sort()).toEqual(['admin', 'customer']);
  });
});

describe('Registration', () => {
  test('renders the register and login pages', async () => {
    const registerPage = await request(app).get('/register');
    const loginPage = await request(app).get('/login');

    expect(registerPage.status).toBe(200);
    expect(registerPage.text).toContain('Create an Account');
    expect(loginPage.status).toBe(200);
    expect(loginPage.text).toContain('Sign In');
  });

  test('creates a customer with a hashed password and redirects to login', async () => {
    const response = await register(request(app));

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login?registered=1');

    const db = getDb();
    const user = await db.collection('users').findOne({ email: newUser.email });
    const role = await db.collection('roles').findOne({ _id: user.role });

    expect(user.displayName).toBe('Jane Smith');
    expect(user.username).toBe('jsmith');
    expect(role.name).toBe('customer');
    expect(user.password).toBeUndefined();
    expect(user.passwordHash).not.toBe(newUser.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  test('ignores a role sent in the form and always assigns customer', async () => {
    await register(request(app), { role: 'admin' });

    const db = getDb();
    const user = await db.collection('users').findOne({ email: newUser.email });
    const role = await db.collection('roles').findOne({ _id: user.role });
    expect(role.name).toBe('customer');
  });

  test('rejects a duplicate email', async () => {
    await register(request(app));
    const response = await register(request(app), { username: 'someone-else' });

    expect(response.status).toBe(409);
    expect(response.text).toContain('An account with that email already exists.');
  });

  test('rejects a duplicate username', async () => {
    await register(request(app));
    const response = await register(request(app), { email: 'other@example.com' });

    expect(response.status).toBe(409);
    expect(response.text).toContain('That username is already taken.');
  });

  test('rejects invalid input without creating a user', async () => {
    const response = await register(request(app), {
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'different'
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain('Please enter a valid email address.');
    expect(response.text).toContain('Passwords do not match.');
    expect(await getDb().collection('users').countDocuments()).toBe(0);
  });
});

describe('Login and logout', () => {
  test('signs in with email and stores the user in the session', async () => {
    const agent = request.agent(app);
    await register(agent);

    const response = await signIn(agent);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({
      displayName: 'Jane Smith',
      username: 'jsmith',
      email: 'jane@example.com',
      role: 'customer'
    });
    expect(me.body.user.passwordHash).toBeUndefined();
  });

  test('signs in with username too', async () => {
    const agent = request.agent(app);
    await register(agent);

    const response = await signIn(agent, 'JSmith');
    expect(response.status).toBe(302);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  test('rejects a wrong password and an unknown user with the same message', async () => {
    const agent = request.agent(app);
    await register(agent);

    const wrongPassword = await signIn(agent, newUser.email, 'wrong-password');
    const unknownUser = await signIn(agent, 'nobody@example.com', newUser.password);

    for (const response of [wrongPassword, unknownUser]) {
      expect(response.status).toBe(401);
      expect(response.text).toContain('Invalid email/username or password.');
    }
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  test('logout destroys the session', async () => {
    const agent = request.agent(app);
    await register(agent);
    await signIn(agent);
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const response = await agent.post('/logout');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('Admin Dashboard', () => {
  test('redirects signed-out visitors to the login page', async () => {
    const response = await request(app).get('/admin/dashboard');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('shows the 403 page to signed-in customers', async () => {
    const agent = request.agent(app);
    await register(agent);
    await signIn(agent);

    const response = await agent.get('/admin/dashboard');
    expect(response.status).toBe(403);
    expect(response.text).toContain('Access Denied');
  });

  test('welcomes admins and sends them there after login', async () => {
    const agent = request.agent(app);
    await register(agent);
    await makeAdmin(newUser.email);

    const login = await signIn(agent);
    expect(login.headers.location).toBe('/admin/dashboard');

    const response = await agent.get('/admin/dashboard');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Welcome to the Admin Dashboard');
  });
});

describe('Auth middleware', () => {
  const customer = { id: '1', role: 'customer' };
  const admin = { id: '2', role: 'admin' };

  test('requireApiLogin returns 401 JSON when signed out', async () => {
    const response = await request(guardedApp(null, requireApiLogin)).get('/guarded');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Authentication required' });
  });

  test('requirePageLogin redirects to /login when signed out', async () => {
    const response = await request(guardedApp(null, requirePageLogin)).get('/guarded');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('requireApiRole returns 401 signed out, 403 for the wrong role, 200 for the right role', async () => {
    const signedOut = await request(guardedApp(null, requireApiRole('admin'))).get('/guarded');
    const wrongRole = await request(guardedApp(customer, requireApiRole('admin'))).get('/guarded');
    const rightRole = await request(guardedApp(admin, requireApiRole('admin'))).get('/guarded');

    expect(signedOut.status).toBe(401);
    expect(wrongRole.status).toBe(403);
    expect(wrongRole.body).toEqual({ message: 'Forbidden' });
    expect(rightRole.status).toBe(200);
  });
});
