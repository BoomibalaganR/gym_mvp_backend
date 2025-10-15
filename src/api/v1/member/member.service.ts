import ApiError from '../../../utils/ApiError';
import Member from './member.model';
import bcrypt from 'bcryptjs';
import httpStatus  from 'http-status';
import paginate from '../../../utils/paginate';

export class MemberService {

  async create(gym: any, user: any, file: any, payload: any) {
    const existing = await Member.findOne({
      gym_id: gym._id,
      $or: [{ name: payload.name }, { phone: payload.phone }]
    });

    if (existing) {
      if (existing.name === payload.name && existing.phone === payload.phone) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Member with same name and phone already exists in this gym'
        );
      } else if (existing.name === payload.name) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Member with the same name already exists in this gym'
        );
      } else if (existing.phone === payload.phone) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Member with the same phone number already exists in this gym'
        );
      }
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    payload.gym_id = gym._id;

    const member = await Member.create({
      name: payload.name,
      phone: payload.phone,
      nick_name: payload.nick_name || null,
      referred_by: payload.referred_by || null,
      address: payload.address,
      working_status: payload.working_status,
      session: payload.session,
      branch: payload.branch,
      gym_id: payload.gym_id,
      password: payload.password || null
    });

    //store profile pic 
    if (file) {
      await member.uploadProfilePic(file);
    }

    return { member };
  }


  async list(gymId: string, q: any) {
    const { page, limit, skip } = paginate(q);
    const search = q.search || '';
    const status = q.status;
    const filter: any = { gym_id: gymId };
    if (status) filter.current_status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { nickname: { $regex: search, $options: 'i' } }
    ];
    const total = await Member.countDocuments(filter);
    const data = await Member.find(filter).skip(skip).limit(limit).select('-password').sort({ createdAt: -1 });
    return { total, page, limit, data };
  }

  async update(gymId: string, id: string, payload: any) {
    if (payload.password) payload.password = await bcrypt.hash(payload.password, 10);
    const updated = await Member.findOneAndUpdate({ _id: id, gym_id: gymId }, payload, { new: true }).select('-password');
    if (!updated) throw new ApiError(404, 'Member not found');
    return updated;
  }

  async remove(gymId: string, id: string) {
    const deleted = await Member.findOneAndDelete({ _id: id, gym_id: gymId });
    if (!deleted) throw new ApiError(404, 'Member not found');
    return deleted;
  }

  async setBotAccess(gymId: string, memberId: string, canAccess: boolean) {
    const updated = await Member.findOneAndUpdate({ _id: memberId, gym_id: gymId, role: 'collector' }, { can_access_bot: canAccess }, { new: true }).select('-password');
    if (!updated) throw new ApiError(404, 'Collector not found');
    return updated;
  }
}
export default new MemberService();
