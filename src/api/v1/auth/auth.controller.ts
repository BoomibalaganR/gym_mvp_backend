import ApiResponse from '../../../utils/ApiResponse';
import { AuthService } from './auth.service';
import catchAsync from '../../../utils/catchAsync';

const service = new AuthService();

export class AuthController {
  login = catchAsync(async (req: any, res: any) => {
    const result = await service.login(req.body);

    return ApiResponse.success(res, 'Login successful', result);
  });
}

export default new AuthController();
