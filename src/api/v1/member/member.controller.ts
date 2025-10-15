import ApiResponse from '../../../utils/ApiResponse';
import MemberService from './member.service';
import catchAsync from '../../../utils/catchAsync';

export class MemberController {
  create = catchAsync(async (req: any, res: any) => {
    const member = await MemberService.create(req.gym, req.user, req.file, req.body);
    return ApiResponse.created(res, 'Member created', member);
  });

  list = catchAsync(async (req: any, res: any) => {
    const user = req.user;
    const result = await MemberService.list(user.gym_id, req.query);
    return ApiResponse.success(res, 'Members fetched', result);
  });

  update = catchAsync(async (req: any, res: any) => {
    const user = req.user;
    const updated = await MemberService.update(user.gym_id, req.params.id, req.body);
    return ApiResponse.success(res, 'Member updated', updated);
  });

  remove = catchAsync(async (req: any, res: any) => {
    const user = req.user;
    await MemberService.remove(user.gym_id, req.params.id);
    return ApiResponse.success(res, 'Member deleted');
  });

  setBotAccess = catchAsync(async (req: any, res: any) => {
    const user = req.user;
    const { memberId, canAccess } = req.body;
    const updated = await MemberService.setBotAccess(user.gym_id, memberId, !!canAccess);
    return ApiResponse.success(res, 'Collector access updated', updated);
  });
}

export default new MemberController();
