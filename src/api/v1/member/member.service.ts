import ApiError from '../../../utils/ApiError';
import { FileUpload } from '../../../services/storage.service';
import Member from './member.model';
import bcrypt from 'bcryptjs';
import httpStatus  from 'http-status';
import paginate from '../../../utils/paginate';

export class MemberService {

  async create(gym: any, user: any, file: any, payload: any) {
    const existing = await Member.findOne({
      gym: gym._id,
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


    payload.gym = gym._id;

    const member = await Member.create({
      name: payload.name,
      phone: payload.phone,
      nickname: payload.nickname || null,
      referred_by: payload.referred_by || null,
      address: payload.address,
      working_status: payload.working_status,
      session: payload.session,
      branch: payload.branch,
      gym: payload.gym,
      password: payload.password
    });

    //store profile pic 
    try {
        if (file) {
        await member.uploadProfilePic(file);
        }

      return { 'id': member.id.toString() };
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        await Member.deleteOne({ _id: member._id }); // rollback member creation
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error uploading profile picture');
    }
  }

  private async sanitizeMember(member: any, fields?: string[]) {
      const profileUrl = member.getProfilePicUrl ? await member.getProfilePicUrl() : '';

      // Base full object
      const full: any = {
          id: member._id?.toString() || null,
          name: member.name || '',
          nickname: member.nickname || '',
          phone: member.phone || '',
          email: member.email || '',
          is_active: member.is_active,
          working_status: member.working_status || '',
          session: member.session || '',
          address: member.address || '',
          createdAt: member.createdAt || null,
          updatedAt: member.updatedAt || null,
          referred_by: member.referred_by
              ? {
                  id: member.referred_by._id?.toString() || null,
                  name: member.referred_by.name || '',
                }
              : {},
          profileUrl,
      };

      if (!fields || fields.length === 0) return full;

      const filtered: any = { id: full.id }; // always include id

      fields.forEach(f => {
          if (f.includes('.')) {
              // nested field like referred_by.name
              const [parent, child] = f.split('.');
              if (full[parent] && full[parent][child] !== undefined) {
                  if (!filtered[parent]) filtered[parent] = {id: full[parent].id}; // always include id of parent
                  filtered[parent][child] = full[parent][child];
              }
          } else if (full[f] !== undefined) {
              filtered[f] = full[f];
          }
      });

      return filtered;
  }

  async list(gym: any, user: any, q: any) {
      const { page, limit, skip } = paginate(q);
      const search = q.search || '';
      const status = q.status;
      const selectedFields = q.fields ? q.fields.split(',') : [];

      const filter: any = { gym: gym, is_admin: false };
      console.log('Filter before applying search/status:', filter, status === 'active', search);
      if (status) filter.is_active = status === 'active';
      if (search) filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { nickname: { $regex: search, $options: 'i' } },
      ];

      const total = await Member.countDocuments(filter);

      // Populate referred_by if needed
      const needRef = selectedFields.some(f => f.startsWith('referred_by'));
      let query = Member.find(filter)
          .skip(skip)
          .limit(limit)
          .select('-password')
          .sort({ createdAt: -1 });

      query = query.populate('referred_by', 'name');

      const members = await query;

      const data = await Promise.all(
          members.map(member => this.sanitizeMember(member, selectedFields))
      );

      return { total, page, limit, data };
  }

  async get(gym: any, user: any, memberId: string, q: any) {
      const selectedFields = q.fields ? q.fields.split(',') : [];
      let query = Member.findOne({ _id: memberId, gym: gym._id }).select('-password');

      // if (selectedFields.some(f => f.startsWith('referred_by'))) {
      query = query.populate('referred_by', 'name');
      // }

      const member = await query;
      if (!member) throw new ApiError(404, 'Member not found');

      return await this.sanitizeMember(member, selectedFields);
  }
  
  async update(gym: any, user: any, memberId: string, payload: any) {
      // Only allow certain fields to be updated
      const allowedFields = ['name', 'nickname', 'email', 'address', 'working_status', 'session', 'branch', 'is_active'];
      const updateData: any = {};
      for (const key of allowedFields) {
          if (payload[key] !== undefined) updateData[key] = payload[key];
      }
      const updated = await Member.findOneAndUpdate(
        { _id: memberId, gym: gym._id },
        { $set: updateData },
        { new: true }
      ).select('-password');
      if (!updated) throw new ApiError(404, 'Member not found');
      
      const sanitized = {
          id: updated._id.toString(),
          name: updated.name,
          nickname: updated.nickname,
          phone: updated.phone,
          email: updated.email,
          working_status: updated.working_status || 'inactive',
          updatedAt: updated.updatedAt,
      };

      return sanitized;
  }

  async uploadProfilePic(gym: any, user: any, memberId: string, file: FileUpload) {
      
      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');

      if (!file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
      try {
          
          return { 'id': member.id.toString(), profileUrl: await member.uploadProfilePic(file) };
          } catch (error) {
              console.error('Error uploading profile picture:', error);
              throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error uploading profile picture');
    
    }
  }

  async deleteProfilePic(gym: any, user: any, memberId: string) {
      
      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');

      try {
          await member.deleteProfilePic();
          return { 'id': member.id.toString() };
      } catch (error) {
          console.error('Error deleting profile picture:', error);
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting profile picture');
      }
  }

  async deactivate(gym: any, user: any, memberId: string) {
    const updated = await Member.findOneAndUpdate(
        { _id: memberId, gym: gym._id },
        { $set: { is_active: false } },
        { new: true }
      ).select('-password');
      if (!updated) throw new ApiError(404, 'Member not found');
    return;
  }

  async setBotAccess(gym: any, memberId: string, canAccess: boolean) {
    const updated = await Member.findOneAndUpdate({ _id: memberId, gym_id: gym._id, role: 'collector' }, { can_access_bot: canAccess }, { new: true }).select('-password');
    if (!updated) throw new ApiError(404, 'Collector not found');
    return updated;
  }
}
export default new MemberService();
