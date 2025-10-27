import { Request, Response } from 'express';

import ApiResponse from '../../../utils/ApiResponse';
import FeeService from './fee.service';
import catchAsync from '../../../utils/catchAsync';

export class FeeController {

    create =  catchAsync(async (req: Request, res: Response) => {
      const fees = await FeeService.createFee(req.gym, req.user, req.params.memberId, req.body);
      return ApiResponse.created(res, 'Fee created', fees);
    });

    list = catchAsync(async (req: Request, res: Response) => {
      const fees = await FeeService.getFeesByDateRange(req.gym, req.user, req.query);
      return ApiResponse.success(res, 'Fees retrieved', fees);
    });
    updateVerified = catchAsync(async (req: Request, res: Response) => {
      const fee = await FeeService.verifyFeesByIds(req.gym, req.user, req.body);
      return ApiResponse.success(res, 'Fee verification updated', fee);
    });
    
    getLastNMonthsMemberPaymentStatus = catchAsync(async (req: Request, res: Response) => {
      const result = await FeeService.getMembersFeeReport(req.gym, req.user, req.query);
      return ApiResponse.success(res, 'Member payment status retrieved', result);
    });
}
export default new FeeController();
