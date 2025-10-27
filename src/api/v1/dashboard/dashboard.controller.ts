import ApiResponse from '../../../utils/ApiResponse';
import DashboardService from './dashboard.service';
import catchAsync from '../../../utils/catchAsync';

export class DashboardController {

    getDashboardSummary = catchAsync(async (req: any, res: any) => {
      const summary = await DashboardService.getDashboardSummary(req.gym, req.user, req.query);
      return ApiResponse.success(res, 'Dashboard summary retrieved', summary);
    });
}

export default new DashboardController();
