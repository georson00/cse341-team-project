import { Router } from 'express';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import authRoutes from './auth-routes.js';
const router = Router();

router.use('/auth', authRoutes);

// JSON API endpoints (/api/...)
router.use(apiRoutes);

// Pages rendered with EJS
router.use(ejsRoutes);

export default router;
