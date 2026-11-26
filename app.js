import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import Path from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json' with { type: 'json' };
import globalMiddleware from './src/middleware/global.js';
import { loadSessionUser } from './src/middleware/auth.js';
import routes from './src/routes/router.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const app = express();

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(globalMiddleware);


const isTest = process.env.NODE_ENV === 'test';

const sessionSecret = isTest
    ? 'kizuna-test-session-secret-not-for-production'
    : process.env.SESSION_SECRET;

const mongoUri = process.env.MONGODB_URI;

if (!sessionSecret || (!isTest && !mongoUri)) {
    throw new Error('Session configuration is missing');
}

const sessionStore = isTest
    ? new session.MemoryStore()
    : MongoStore.create({
        mongoUrl: mongoUri,
        dbName: process.env.MONGODB_DB_NAME,
        collectionName: 'sessions'
    });

app.set('trust proxy', 1);

app.use(session({
    name: 'kizuna.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    // Reset the 1-hour expiry on every response (1 hour of inactivity).
    rolling: true,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
    }
}));

// Copy the signed-in user (or null) to req.user and res.locals.user.
// Must run after the session middleware and before any routes.
app.use(loadSessionUser);

// Interactive API documentation generated from the @openapi comments.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
