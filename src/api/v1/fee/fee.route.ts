import { createFeeSchema, feeDateRangeSchema, lastNMonthsMemberSchema, verifyFeeSchema } from './fee.validation';

import FeeController from './fee.controller';
import { Router } from 'express';
import authenticateUser from '../../../middlewares/auth.middleware';
import authorize from '../../../middlewares/role.middleware';
import validate from '../../../middlewares/validate.middleware';

const router = Router();

router.post('/:memberId/create', authenticateUser, authorize('owner', 'collector'), validate(createFeeSchema), FeeController.create);
router.get('/list', authenticateUser, authorize('owner', 'collector'), validate(feeDateRangeSchema), FeeController.list);
router.post('/verify', authenticateUser, authorize('owner', 'collector'), validate(verifyFeeSchema), FeeController.updateVerified);
router.get('/last-n-months', authenticateUser, authorize('owner', 'collector'), validate(lastNMonthsMemberSchema), FeeController.getLastNMonthsMemberPaymentStatus);
export default router;