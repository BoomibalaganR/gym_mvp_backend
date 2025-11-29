import httpStatus from 'http-status';
import { FileUpload } from '../../../services/storage/providers/storage.provider.interface';
import ApiError from '../../../utils/ApiError';
import { getMonthRange } from '../../../utils/date.util';
import paginate from '../../../utils/paginate';
import Fee from '../fee/fee.model';
import FeeService from '../fee/fee.service';
import Member from './member.model';

export class MemberService {

  async create(gym: any, user: any, file: any, payload: any) {
    const existing = await Member.findOne({
      gym: gym._id,
      $or: [{ first_name: payload.first_name }, { phone: payload.phone }]
    });

    if (existing) { 
      if (existing.first_name === payload.first_name && existing.phone === payload.phone) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Member with same name and phone already exists in this gym'
        );
      } else if (existing.first_name === payload.first_name) {
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
      first_name: payload.first_name,
      last_name: payload.last_name || null,
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
  
  private async sanitizeMember(gym: any, user: any, member: any, fields?: string[]) {
      const profileUrl = await member.getProfilePicSignedUrl();
      const  {unpaidMonths} = await FeeService.getUnpaidMonth(member.id) 
      const {data: payment_history} = await FeeService.getFeesByDateRange(gym, user, {
        memberId: member.id,
        months: 3,   // last 3 paid months
        });
        
      // Base full object
      const full: any = {
          id: member._id?.toString() || null,
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          nickname: member.nickname || '',
          phone: member.phone || '',
          email: member.email || '',
          is_active: member.is_active,
          working_status: member.working_status || '',
          session: member.session || '',
          gender: member.gender || '',
          branch: member.branch || '',
          address: member.address || '',
          joining_date: member.createdAt || null,
          updated_at: member.updatedAt || null,
          referred_by: member.referred_by
              ? {
                  id: member.referred_by._id?.toString() || null,
                  first_name: member.referred_by.first_name || '', 
                  last_name: member.referred_by.last_name || '',
                  phone: member.referred_by.phone || '',
                  nickname: member.referred_by.nickname || '', 
                  profilePicUrl: await member.referred_by.getProfilePicSignedUrl(),
                  profileHash: member.referred_by.profilepic_hash || null,
                }
              : null,
          profilePicUrl:profileUrl, 
        profileHash: member.profilepic_hash || null, 
        unpaidMonths: unpaidMonths, 
        payment_history: payment_history
      };
      if (!fields || fields.length === 0) return full;
      
      const filtered: any = { id: full.id }; // always include id
      console.log(full)
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
      console.log()
      console.log(filtered)
      return filtered;
  }

async list(gym: any, user: any, q: any) {
  const { page, limit, skip } = paginate(q);
  const search = q.search || "";
  const status = q.status;
  const payment = q.payment;     // paid | unpaid | pending
  const monthStr = q.month;      // YYYY-MM

  const selectedFields = q.fields?.split(",").map(f => f.trim()) || [];

  // --------------------------------------
  // 1. Base member filter
  // --------------------------------------
  const filter: any = { gym: gym, is_admin: false };

  if (status) filter.is_active = status === "active";

  if (search) {
    filter.$or = [
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { nickname: { $regex: search, $options: "i" } }
    ];
  }

  // --------------------------------------
  // 2. Get active members first
  // --------------------------------------
  const totalMembers = await Member.countDocuments(filter);

  let query = Member.find(filter)
    .skip(skip)
    .limit(limit)
    .select("-password")
    .sort({ createdAt: -1 })
    .populate("referred_by", "first_name last_name nickname phone");

  const members = await query;

  // No payment filter → return normally
  if (!payment) {
    const data = await Promise.all(
      members.map(m => this.sanitizeMember(gym, user, m, selectedFields))
    );
    return { total: totalMembers, page, limit, members: data };
  }

  // --------------------------------------
  // 3. PAYMENT FILTER LOGIC
  // --------------------------------------
  const { start, end } = getMonthRange(monthStr);
 
  // Get fee records for ALL listed members in one query (fast)
  const memberIds = members.map(m => m._id);

  const feeRecords = await Fee.find({
    gym: gym._id,
    member: { $in: memberIds },
    month: { $gte: start, $lt: end }
  })
    .select("member paymentStatus")
    .lean();

  // Map → memberId → status
  const statusMap = new Map();
  feeRecords.forEach(r => statusMap.set(String(r.member), r.paymentStatus));
  console.log(feeRecords)
  // Apply payment=paid | unpaid | pending
  const filteredMembers = members.filter(m => {
    const currentStatus = statusMap.get(String(m._id));

    if (payment === "paid") return currentStatus === "paid";
    if (payment === "pending") return currentStatus === "pending";
    if (payment === "unpaid") return !currentStatus; // no fee created = unpaid

    return true;
  });
  console.log(filteredMembers)
  const data = await Promise.all(
    filteredMembers.map(m => this.sanitizeMember(gym, user, m, selectedFields))
  );

  return {
    total: filteredMembers.length,
    page,
    limit,
    members: data
  };
}

  async get(gym: any, user: any, memberId: string, q: any) {
      const selectedFields = q.fields?.split(',').map(f => f.trim()).filter(Boolean) || [];
      let query = Member.findOne({ _id: memberId, gym: gym._id }).select('-password');

      // if (selectedFields.some(f => f.startsWith('referred_by'))) {
      query = query.populate('referred_by', 'first_name last_name nickname phone profilepic_hash profilepic_content_type');
      // }

      const member = await query;
      if (!member) throw new ApiError(404, 'Member not found');

      return await this.sanitizeMember(gym, user, member, selectedFields);
  }
  
  async update(gym: any, user: any, memberId: string, payload: any) {
      // Only allow certain fields to be updated
      const allowedFields = ['first_name', 'last_name', 'nickname', 'email', 'address', 'working_status', 'session', 'branch', 'is_active', 'referred_by', 'phone', 'gender']; 
      console.log("Update payload:", payload);
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
          first_name: updated.first_name,
          last_name: updated.last_name,
          nickname: updated.nickname,
          phone: updated.phone,
          email: updated.email,
          working_status: updated.working_status || 'inactive',
          updatedAt: updated.updatedAt,
      };

      return sanitized;
  }
  
 async getProfilePicUrl(gymId: string, user: any, memberId: string) {

  const member = await Member.findOne({
    _id: memberId,
    gym: gymId
  }).select("profilepic_hash profilepic_content_type");

  if (!member || !member.profilepic_hash) {
    throw new ApiError(httpStatus.NOT_FOUND, "Profile picture not found");
  }

  // Always return signed URL
  return await member.getSignedProfilePicUrl();
}


  async uploadProfilePic(gym: any, user: any, memberId: string, file: FileUpload) {
      
      const member = await Member.findById(memberId);
      if (!member) throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');

      if (!file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
      try {
          
          await member.uploadProfilePic(file) 
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
