import AuthController from './auth.controller';
import { Router } from 'express';
import {loginSchema} from './auth.validation'
import validate from '../../../middlewares/validate.middleware';

const router = Router();
router.post('/login', validate(loginSchema), AuthController.login);

export default router;
