import MemberController from './member.controller';
import { Router } from 'express';
import authenticate from '../../../middlewares/auth.middleware';
import authorize from '../../../middlewares/role.middleware';
import { createMemberSchema } from './member.validation';
import validate from './../../../middlewares/validate.middleware';

const router = Router();

router.post('/', authenticate, authorize('owner', 'collector'), validate(createMemberSchema), MemberController.create);
router.get('/', authenticate, authorize('owner', 'collector'), MemberController.list);
router.put('/:id', authenticate, authorize('owner'), MemberController.update);
router.delete('/:id', authenticate, authorize('owner'), MemberController.remove);
router.patch('/bot-access', authenticate, authorize('owner'), MemberController.setBotAccess);

export default router;
