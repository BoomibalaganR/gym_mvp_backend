import { createFeeSchema, feeDateRangeSchema, lastNMonthsMemberSchema, markPendingFeeSchema, verifyFeeSchema } from './fee.validation';

import { Router } from 'express';
import authenticateUser from '../../../middlewares/auth.middleware';
import authorize from '../../../middlewares/role.middleware';
import validate from '../../../middlewares/validate.middleware';
import FeeController from './fee.controller';

const router = Router();

router.post('/:memberId/create', authenticateUser, authorize('owner', 'collector'), validate(createFeeSchema), FeeController.create);
router.get('/', authenticateUser, authorize('owner', 'collector'), validate(feeDateRangeSchema), FeeController.list);
router.patch('/verify', authenticateUser, authorize('owner', 'collector'), validate(verifyFeeSchema), FeeController.updateVerified); 

router.patch('/pending/pay', authenticateUser, authorize('owner', 'collector'), validate(markPendingFeeSchema),FeeController.markPendingAsPaid);
router.get('/report', authenticateUser, authorize('owner', 'collector'), validate(lastNMonthsMemberSchema), FeeController.getLastNMonthsMemberPaymentStatus);
export default router;