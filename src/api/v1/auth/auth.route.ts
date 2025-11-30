import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import AuthController from './auth.controller';
import { loginSchema } from './auth.validation';

const router = Router();
router.post('/login', validate(loginSchema), AuthController.login);

export default router;
