import GymController from './gym.controller';
import { Router } from 'express';
import { createGymSchema } from './gym.validation';
import validate from '../../../middlewares/validate.middleware';

const router = Router();

router.post('/onboard', validate(createGymSchema), GymController.onboard);
router.get('/:id', GymController.get);

export default router;
