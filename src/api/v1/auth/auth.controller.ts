import ApiResponse from '../../../utils/ApiResponse';
import { AuthService } from './auth.service';
import catchAsync from '../../../utils/catchAsync';

const service = new AuthService();

export class AuthController {
  login = catchAsync(async (req: any, res: any) => {
    const { phone, email, password } = req.body;
    const result = await service.login(email, password);
    return ApiResponse.success(res, 'Login successful', result);
  });
}

export default new AuthController();
