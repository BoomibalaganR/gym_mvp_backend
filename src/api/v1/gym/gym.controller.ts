import ApiResponse from '../../../utils/ApiResponse';
import { GymService } from './gym.service';
import catchAsync from '../../../utils/catchAsync';

export class GymController {
  service: GymService;
  constructor() { this.service = new GymService(); }

  onboard = catchAsync(async (req: any, res: any) => {
    const result = await this.service.createGymWithOwner(req.body);   
    return ApiResponse.created(res, 'Gym onboarded', result);
  });

  get = catchAsync(async (req: any, res: any) => {
    const gym = await this.service.getGymById(req.params.id);
    return ApiResponse.success(res, 'Gym fetched', gym);
  });
}

export default new GymController();
