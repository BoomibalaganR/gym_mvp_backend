import ApiResponse from '../../../utils/ApiResponse';
import catchAsync from '../../../utils/catchAsync';
import MemberService from './member.service';

export class MemberController {
    
  create = catchAsync(async (req: any, res: any) => {
    const member = await MemberService.create(req.gym, req.user, req.file, req.body);
    return ApiResponse.created(res, 'Member created', member);
  });

  list = catchAsync(async (req: any, res: any) => {
    const result = await MemberService.list(req.gym, req.user, req.query);
    return ApiResponse.success(res, 'Members fetched', result);
  });

  get = catchAsync(async (req: any, res: any) => {
    const result = await MemberService.get(req.gym, req.user, req.params.id, req.query);
    return ApiResponse.success(res, 'Member fetched', result);
  });
  
  update = catchAsync(async (req: any, res: any) => {
    const updated = await MemberService.update(req.gym, req.user, req.params.id, req.body);
    return ApiResponse.success(res, 'Member updated', updated);
  });

  getProfilePic = catchAsync(async (req: any, res: any) => {
    const signedUrl = await MemberService.getProfilePicUrl(req.gym, req.user, req.params.id);
    return ApiResponse.success(res, 'Profile picture URL fetched', { url: signedUrl });

  });
  
  uploadProfilePic = catchAsync(async (req: any, res: any) => {
    const updated = await MemberService.uploadProfilePic(req.gym, req.user, req.params.id, req.file);
    return ApiResponse.success(res, 'Profile picture uploaded', updated);
  });

  deleteProfilePic = catchAsync(async (req: any, res: any) => {  
    const updated = await MemberService.deleteProfilePic(req.gym, req.user, req.params.id);
    return ApiResponse.success(res, 'Profile picture deleted', updated);
  });
  
  deactivate = catchAsync(async (req: any, res: any) => {
    await MemberService.deactivate(req.gym, req.user, req.params.id);
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
