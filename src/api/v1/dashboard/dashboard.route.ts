import { Router } from 'express';
import authenticateUser from '../../../middlewares/auth.middleware';
import authorize from '../../../middlewares/role.middleware';
import DashboardController from './dashboard.controller';

const router = Router();

router.get('/summary', authenticateUser, authorize('owner', 'collector'), DashboardController.getDashboardSummary);

export default router;
