import { createMemberSchema, updateMemberSchema } from './member.validation';

import MemberController from './member.controller';
import { Router } from 'express';
import authenticateUser from '../../../middlewares/auth.middleware';
import authorize from '../../../middlewares/role.middleware';
import validate from './../../../middlewares/validate.middleware';

const router = Router();

router.post('/', authenticateUser, authorize('owner', 'collector'), validate(createMemberSchema), MemberController.create);
router.get('/', authenticateUser, authorize('owner', 'collector'), MemberController.list);

router.get('/:id', authenticateUser, authorize('owner'), MemberController.get);
router.put('/:id', authenticateUser, authorize('owner'), validate(updateMemberSchema), MemberController.update);
router.delete('/:id', authenticateUser, authorize('owner'), MemberController.deactivate);
router.patch('/bot-access', authenticateUser, authorize('owner'), MemberController.setBotAccess);

router.get('/:id/profile-pic', authenticateUser, authorize('owner'), MemberController.getProfilePic);
router.post('/:id/profile-pic', authenticateUser, authorize('owner'), MemberController.uploadProfilePic);
router.delete('/:id/profile-pic', authenticateUser, authorize('owner'), MemberController.deleteProfilePic);
export default router;
