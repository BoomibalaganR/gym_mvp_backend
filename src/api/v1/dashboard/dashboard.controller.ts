import ApiResponse from '../../../utils/ApiResponse';
import catchAsync from '../../../utils/catchAsync';
import DashboardService from './dashboard.service';

export class DashboardController {

    getDashboardSummary = catchAsync(async (req: any, res: any) => {
      const summary = await DashboardService.getDashboardSummary(req.gym, req.user, req.query);
      return ApiResponse.success(res, 'Dashboard summary retrieved', summary);
    });
}

export default new DashboardController();
