"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const date_util_1 = require("../../../utils/date.util");
const paginate_1 = __importDefault(require("../../../utils/paginate"));
const fee_model_1 = __importDefault(require("../fee/fee.model"));
const fee_service_1 = __importDefault(require("../fee/fee.service"));
const member_model_1 = __importDefault(require("./member.model"));
class MemberService {
    async create(gym, user, file, payload) {
        const existing = await member_model_1.default.findOne({
            gym: gym._id,
            $or: [{ first_name: payload.first_name }, { phone: payload.phone }]
        });
        if (existing) {
            if (existing.first_name === payload.first_name && existing.phone === payload.phone) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Member with same name and phone already exists in this gym');
            }
            else if (existing.first_name === payload.first_name) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Member with the same name already exists in this gym');
            }
            else if (existing.phone === payload.phone) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Member with the same phone number already exists in this gym');
            }
        }
        payload.gym = gym._id;
        const member = await member_model_1.default.create({
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
        }
        catch (error) {
            console.error('Error uploading profile picture:', error);
            await member_model_1.default.deleteOne({ _id: member._id }); // rollback member creation
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Error uploading profile picture');
        }
    }
    async sanitizeMember(gym, user, member, fields) {
        const profileUrl = await member.getProfilePicSignedUrl();
        const { unpaidMonths } = await fee_service_1.default.getMemberMonthStatus(member.id);
        const { data: payment_history } = await fee_service_1.default.getFeesByDateRange(gym, user, {
            memberId: member.id,
            limit: 3, // last 3 paid months
        });
        // Base full object
        const full = {
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
            profilePicUrl: profileUrl,
            profileHash: member.profilepic_hash || null,
            unpaidMonths: unpaidMonths,
            payment_history: payment_history
        };
        if (!fields || fields.length === 0)
            return full;
        const filtered = { id: full.id }; // always include id
        console.log(full);
        fields.forEach(f => {
            if (f.includes('.')) {
                // nested field like referred_by.name
                const [parent, child] = f.split('.');
                if (full[parent] && full[parent][child] !== undefined) {
                    if (!filtered[parent])
                        filtered[parent] = { id: full[parent].id }; // always include id of parent
                    filtered[parent][child] = full[parent][child];
                }
            }
            else if (full[f] !== undefined) {
                filtered[f] = full[f];
            }
        });
        console.log();
        console.log(filtered);
        return filtered;
    }
    async list(gym, user, q) {
        const { page, limit, skip } = (0, paginate_1.default)(q);
        const search = q.search || "";
        const status = q.status;
        const payment = q.payment; // paid | unpaid | pending
        const monthStr = q.month; // YYYY-MM
        const selectedFields = q.fields?.split(",").map(f => f.trim()) || [];
        // --------------------------------------
        // 1. Base member filter
        // --------------------------------------
        const filter = { gym: gym, is_admin: false };
        if (status)
            filter.is_active = status === "active";
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
        const totalMembers = await member_model_1.default.countDocuments(filter);
        let query = member_model_1.default.find(filter)
            .skip(skip)
            .limit(limit)
            .select("-password")
            .sort({ createdAt: -1 })
            .populate("referred_by", "first_name last_name nickname phone");
        const members = await query;
        // No payment filter → return normally
        if (!payment) {
            const data = await Promise.all(members.map(m => this.sanitizeMember(gym, user, m, selectedFields)));
            return { total: totalMembers, page, limit, members: data };
        }
        // --------------------------------------
        // 3. PAYMENT FILTER LOGIC
        // --------------------------------------
        const { start, end } = (0, date_util_1.getMonthRange)(monthStr);
        // Get fee records for ALL listed members in one query (fast)
        const memberIds = members.map(m => m._id);
        const feeRecords = await fee_model_1.default.find({
            gym: gym._id,
            member: { $in: memberIds },
            month: { $gte: start, $lt: end }
        })
            .select("member paymentStatus")
            .lean();
        // Map → memberId → status
        const statusMap = new Map();
        feeRecords.forEach(r => statusMap.set(String(r.member), r.paymentStatus));
        console.log(feeRecords);
        // Apply payment=paid | unpaid | pending
        const filteredMembers = members.filter(m => {
            const currentStatus = statusMap.get(String(m._id));
            if (payment === "paid")
                return currentStatus === "paid";
            if (payment === "pending")
                return currentStatus === "pending";
            if (payment === "unpaid")
                return !currentStatus; // no fee created = unpaid
            return true;
        });
        console.log(filteredMembers);
        const data = await Promise.all(filteredMembers.map(m => this.sanitizeMember(gym, user, m, selectedFields)));
        return {
            total: filteredMembers.length,
            page,
            limit,
            members: data
        };
    }
    async get(gym, user, memberId, q) {
        const selectedFields = q.fields?.split(',').map(f => f.trim()).filter(Boolean) || [];
        let query = member_model_1.default.findOne({ _id: memberId, gym: gym._id }).select('-password');
        // if (selectedFields.some(f => f.startsWith('referred_by'))) {
        query = query.populate('referred_by', 'first_name last_name nickname phone profilepic_hash profilepic_content_type');
        // }
        const member = await query;
        if (!member)
            throw new ApiError_1.default(404, 'Member not found');
        return await this.sanitizeMember(gym, user, member, selectedFields);
    }
    async update(gym, user, memberId, payload) {
        // Only allow certain fields to be updated
        const allowedFields = ['first_name', 'last_name', 'nickname', 'email', 'address', 'working_status', 'session', 'branch', 'is_active', 'referred_by', 'phone', 'gender'];
        console.log("Update payload:", payload);
        const updateData = {};
        for (const key of allowedFields) {
            if (payload[key] !== undefined)
                updateData[key] = payload[key];
        }
        const updated = await member_model_1.default.findOneAndUpdate({ _id: memberId, gym: gym._id }, { $set: updateData }, { new: true }).select('-password');
        if (!updated)
            throw new ApiError_1.default(404, 'Member not found');
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
    async getProfilePicUrl(gymId, user, memberId) {
        const member = await member_model_1.default.findOne({
            _id: memberId,
            gym: gymId
        }).select("profilepic_hash profilepic_content_type");
        if (!member || !member.profilepic_hash) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Profile picture not found");
        }
        // Always return signed URL
        return await member.getSignedProfilePicUrl();
    }
    async uploadProfilePic(gym, user, memberId, file) {
        const member = await member_model_1.default.findById(memberId);
        if (!member)
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Member not found');
        if (!file)
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'No file uploaded');
        try {
            await member.uploadProfilePic(file);
        }
        catch (error) {
            console.error('Error uploading profile picture:', error);
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Error uploading profile picture');
        }
    }
    async deleteProfilePic(gym, user, memberId) {
        const member = await member_model_1.default.findById(memberId);
        if (!member)
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Member not found');
        try {
            await member.deleteProfilePic();
            return { 'id': member.id.toString() };
        }
        catch (error) {
            console.error('Error deleting profile picture:', error);
            throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Error deleting profile picture');
        }
    }
    async deactivate(gym, user, memberId) {
        const updated = await member_model_1.default.findOneAndUpdate({ _id: memberId, gym: gym._id }, { $set: { is_active: false } }, { new: true }).select('-password');
        if (!updated)
            throw new ApiError_1.default(404, 'Member not found');
        return;
    }
    async setBotAccess(gym, memberId, canAccess) {
        const updated = await member_model_1.default.findOneAndUpdate({ _id: memberId, gym_id: gym._id, role: 'collector' }, { can_access_bot: canAccess }, { new: true }).select('-password');
        if (!updated)
            throw new ApiError_1.default(404, 'Collector not found');
        return updated;
    }
}
exports.MemberService = MemberService;
exports.default = new MemberService();
