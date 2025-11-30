import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import GymController from './gym.controller';
import { createGymSchema } from './gym.validation';

const router = Router();

router.post('/onboard', validate(createGymSchema), GymController.onboard);
router.get('/:id', GymController.get);
router.get('/', GymController.list);

export default router;
