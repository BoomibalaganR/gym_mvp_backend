import ApiResponse from '../../../utils/ApiResponse';
import catchAsync from '../../../utils/catchAsync';
import { AuthService } from './auth.service';

const service = new AuthService();

export class AuthController {
  login = catchAsync(async (req: any, res: any) => {
    const result = await service.login(req.body);

    return ApiResponse.success(res, 'Login successful', result);
  });
}

export default new AuthController();
