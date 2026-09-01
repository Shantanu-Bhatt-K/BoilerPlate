import { Router } from 'express';
import healthRoutes from './health.routes.js';
import fileRoutes from './file.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(fileRoutes);

export default router;
