import { Router } from 'express';
import healthRoutes from './health.routes.js';
import fileRoutes from './file.routes.js';
import authRoutes from './auth.routes.js';
const router = Router();

router.use(healthRoutes);
router.use(fileRoutes);
router.use(authRoutes);

export default router;
