"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeService = void 0;
const date_fns_1 = require("date-fns");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const date_util_1 = require("../../../utils/date.util");
const member_model_1 = __importDefault(require("../member/member.model"));
const fee_model_1 = __importDefault(require("./fee.model"));
class FeeService {
    // ✅ Create fee with partial payments and bulk insert
    async createFee(gym, user, memberId, payload) {
        // 1. Validate member
        const member = await member_model_1.default.findOne({ _id: memberId, gym: gym._id }).select("-password");
        if (!member)
            throw new ApiError_1.default(404, "Member not found");
        // 2. Extract payload
        const gymMonthlyFee = gym.monthlyFee || 200;
        const { amount: totalPaid, months, paymentType, transactionId } = payload;
        // Convert input months → normalized Date
        const normalizedMonths = months.map(m => {
            const [year, month] = m.split("-");
            return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
        });
        // 3. Fetch existing fees already paid for these months
        const existingFees = await fee_model_1.default.find({
            gym: gym._id,
            member: member._id,
            month: { $in: normalizedMonths }
        });
        const existingMonthDates = existingFees.map(f => f.month.getTime());
        // 4. Prepare new fee records
        let remainingAmount = totalPaid;
        const newFeeRecords = [];
        for (let i = 0; i < normalizedMonths.length; i++) {
            const monthDate = normalizedMonths[i];
            // Skip if already exists
            if (existingMonthDates.includes(monthDate.getTime()))
                continue;
            let paidAmount = 0;
            let pendingAmount = gymMonthlyFee;
            let paymentStatus = "pending";
            // Logic: Deduct fee for each month from remainingAmount
            if (remainingAmount >= gymMonthlyFee) {
                paidAmount = gymMonthlyFee;
                pendingAmount = 0;
                paymentStatus = "paid";
                remainingAmount -= gymMonthlyFee;
            }
            else if (remainingAmount > 0) {
                paidAmount = remainingAmount;
                pendingAmount = gymMonthlyFee - remainingAmount;
                remainingAmount = 0;
                paymentStatus = "pending";
            }
            newFeeRecords.push({
                gym: gym._id,
                member: member._id,
                month: monthDate,
                totalAmount: gymMonthlyFee,
                paidAmount,
                pendingAmount,
                paymentStatus,
                paymentType,
                collectedBy: user._id,
                dateOfPayment: new Date(),
                transactionId
            });
        }
        // 5. Insert new fee records
        const insertedFees = await fee_model_1.default.insertMany(newFeeRecords);
        // 6. Prepare clean response
        return {
            created: insertedFees.map(fee => ({
                fee_id: fee._id,
                month: fee.month,
                paidAmount: fee.paidAmount,
                pendingAmount: fee.pendingAmount,
                paymentStatus: fee.paymentStatus
            })),
            alreadyPaidMonths: normalizedMonths.filter(m => existingMonthDates.includes(m.getTime()))
        };
    }
    async getMemberMonthStatus(memberId) {
        // -----------------------------
        // 1. Get member
        // -----------------------------
        const member = await member_model_1.default.findOne({ _id: memberId }).select("+createdAt");
        if (!member)
            throw new ApiError_1.default(404, "Member not found");
        // Normalize signup month (UTC safe)
        const created = new Date(member.createdAt);
        const startYear = created.getUTCFullYear();
        const startMonth = created.getUTCMonth(); // 0-11
        // -----------------------------
        // 2. Get all fee records for this member
        // -----------------------------
        const fees = await fee_model_1.default.find({ member: memberId })
            .select("month pendingAmount");
        // Normalize fee.month to "YYYY-MM"
        const paidMonths = new Set();
        const pendingMonths = new Set();
        for (const f of fees) {
            const monthStr = (0, date_fns_1.format)(new Date(f.month), "yyyy-MM");
            if (Number(f.pendingAmount) > 0) {
                pendingMonths.add(monthStr); // Partially paid
            }
            else {
                paidMonths.add(monthStr); // Fully paid
            }
        }
        // -----------------------------
        // 3. Generate all months from createdAt → today
        // -----------------------------
        const today = new Date();
        const currentYear = today.getUTCFullYear();
        const currentMonth = today.getUTCMonth();
        const allMonths = [];
        let y = startYear;
        let m = startMonth;
        while (y < currentYear || (y === currentYear && m <= currentMonth)) {
            const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
            allMonths.push(monthStr);
            m++;
            if (m > 11) {
                m = 0;
                y++;
            }
        }
        // -----------------------------
        // 4. Compute unpaid months
        // -----------------------------
        const unpaidMonths = [];
        for (const month of allMonths) {
            if (!paidMonths.has(month) && !pendingMonths.has(month)) {
                unpaidMonths.push(month);
            }
        }
        return {
            memberId,
            createdAt: created,
            paidMonths: Array.from(paidMonths).sort(),
            pendingMonths: Array.from(pendingMonths).sort(),
            unpaidMonths: unpaidMonths.sort()
        };
    }
    async getFeesByDateRange(gym, user, query) {
        const { start, end, verifiedByOwner, paymentType, paymentStatus, memberId, limit, month } = query;
        const filter = { gym: gym._id };
        // --------------------------
        // 🔹 1. MEMBER FILTER
        // --------------------------
        if (memberId) {
            filter.member = memberId;
        }
        // --------------------------
        // 🔹 2. VERIFIED / PAYMENT FILTER
        // --------------------------
        if (verifiedByOwner !== undefined)
            filter.verifiedByOwner =
                verifiedByOwner === "true" || verifiedByOwner === true;
        if (paymentType)
            filter.paymentType = paymentType;
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        // --------------------------
        // 🔹 3. DATE FILTER LOGIC
        // --------------------------
        let queryLimit;
        // Case A: Limit last N months
        if (limit) {
            queryLimit = Number(limit);
            if (isNaN(queryLimit) || queryLimit <= 0)
                throw new ApiError_1.default(400, "Invalid limit value");
        }
        // Case B: Month range for a specific month (YYYY-MM)
        else if (month) {
            try {
                const { start, end } = (0, date_util_1.getMonthRange)(month);
                filter.month = { $gte: start, $lte: end };
            }
            catch {
                throw new ApiError_1.default(400, "Invalid month format — use YYYY-MM");
            }
        }
        // Case C: Custom start + end range
        else if (start && end) {
            const startDate = (0, date_fns_1.startOfMonth)((0, date_fns_1.parseISO)(start));
            const endDate = (0, date_fns_1.endOfMonth)((0, date_fns_1.parseISO)(end));
            filter.month = { $gte: startDate, $lte: endDate };
        }
        // --------------------------
        // 🔹 4. QUERY BUILD
        // --------------------------
        let queryBuilder = fee_model_1.default.find(filter)
            .populate([
            { path: "member", select: "first_name last_name nickname phone profilepic_hash profilepic_content_type" },
            { path: "collectedBy", select: "first_name last_name phone" }
        ])
            .sort({ month: -1 }); // latest month first
        // Apply limit
        if (queryLimit)
            queryBuilder = queryBuilder.limit(queryLimit);
        const fees = await queryBuilder;
        // --------------------------
        // 🔹 5. RESPONSE
        // --------------------------
        const data = await Promise.all(fees.map(async (fee) => ({
            id: fee._id,
            month: fee.month,
            totalAmount: gym.monthlyFee || 200,
            paidAmount: fee.paidAmount,
            pendingAmount: fee.pendingAmount,
            paymentStatus: fee.paymentStatus,
            paymentType: fee.paymentType,
            verifiedByOwner: fee.verifiedByOwner,
            member: fee.member
                ? {
                    id: fee.member.id,
                    name: fee.member.getFullName(),
                    phone: fee.member.phone,
                    profilePicUrl: await fee.member.getProfilePicSignedUrl(),
                    profileHash: fee.member.profilepic_hash || null
                }
                : null,
            dateOfPayment: fee.dateOfPayment,
            collectedBy: fee.collectedBy
                ? { id: fee.collectedBy.id, name: fee.collectedBy.getFullName() }
                : null
        })));
        return { count: fees.length, data };
    }
    // ✅ Mark multiple fees as verified by owner
    async verifyFeesByIds(gym, user, payload) {
        const { feeIds } = payload;
        if (!feeIds || feeIds.length === 0)
            throw new ApiError_1.default(400, "No fees selected");
        console.log("inside fee service: ", payload);
        const fees = await fee_model_1.default.find({ _id: { $in: feeIds }, gym: gym._id });
        if (!fees || fees.length === 0)
            throw new ApiError_1.default(404, "Fees not found");
        const verifiedFees = [];
        const alreadyVerifiedIds = [];
        for (const fee of fees) {
            if (fee.verifiedByOwner) {
                alreadyVerifiedIds.push(fee._id.toString());
                continue;
            }
            fee.verifiedByOwner = true;
            await fee.save();
            verifiedFees.push(fee);
        }
        return {
            verified: verifiedFees.map(f => ({
                fee_id: f._id,
                month: f.month,
                paidAmount: f.paidAmount,
                pendingAmount: f.pendingAmount,
                paymentStatus: f.paymentStatus
            })),
            alreadyVerifiedIds
        };
    }
    async markPendingFeeAsPaid(gym, user, payload) {
        const { feeId, amount } = payload;
        if (!feeId)
            throw new ApiError_1.default(400, "feeId is required");
        if (!amount || amount <= 0)
            throw new ApiError_1.default(400, "Payment amount must be > 0");
        const fee = await fee_model_1.default.findOne({ _id: feeId, gym: gym._id });
        if (!fee)
            throw new ApiError_1.default(404, "Fee not found");
        // Already paid
        if (fee.paymentStatus === "paid") {
            return {
                alreadyPaid: true,
                message: "This fee is already fully paid",
                feeId,
                month: fee.month,
            };
        }
        const previousPaid = fee.paidAmount || 0;
        const previousPending = fee.pendingAmount || 0;
        // Ensure user cannot pay more than pending
        if (amount > previousPending) {
            throw new ApiError_1.default(400, "Payment amount exceeds pendingAmount");
        }
        // New totals
        const newPaidAmount = previousPaid + amount;
        const newPendingAmount = previousPending - amount;
        fee.paidAmount = newPaidAmount;
        fee.pendingAmount = newPendingAmount;
        // Update status
        if (newPendingAmount === 0) {
            fee.paymentStatus = "paid";
        }
        else {
            fee.paymentStatus = "pending";
        }
        await fee.save();
        return {
            feeId: fee._id,
            month: fee.month,
            totalAmount: fee.totalAmount,
            paidAmount: fee.paidAmount,
            pendingAmount: fee.pendingAmount,
            paymentStatus: fee.paymentStatus,
            message: fee.paymentStatus === "paid"
                ? "Fee fully paid successfully"
                : "Partial pending payment recorded successfully",
        };
    }
    async getMembersFeeReport(gym, user, query) {
        const { status, month, monthsCount = 0, continuousUnpaid = false } = query;
        const today = new Date();
        let months = [];
        // 🗓️ Build month list
        if (month)
            months = [month];
        else if (monthsCount > 0) {
            for (let i = 1; i <= monthsCount; i++) {
                months.push((0, date_fns_1.format)((0, date_fns_1.subMonths)(today, i), "yyyy-MM"));
            }
        }
        else
            months = [(0, date_fns_1.format)(today, "yyyy-MM")];
        // 🧾 Get all active members
        const members = await member_model_1.default.find({
            gym: gym._id,
            role: { $ne: "owner" },
        });
        // 🧾 Get all fee records for these months
        const fees = await fee_model_1.default.find({
            gym: gym._id,
            month: { $in: months },
        }).populate("collectedBy", "name");
        const feeMap = new Map();
        for (const f of fees) {
            if (!feeMap.has(f.member.toString()))
                feeMap.set(f.member.toString(), []);
            feeMap.get(f.member.toString()).push(f);
        }
        const paidMembers = [];
        const unpaidMembers = [];
        const pendingMembers = [];
        for (const member of members) {
            const memberFees = feeMap.get(member._id.toString()) || [];
            const memberInfo = {
                _id: member._id,
                phone: member.phone,
                nickname: member.nickname,
                is_active: member.is_active,
                memberName: member.name,
                profile_url: await member.getProfilePicSignedUrl(),
            };
            // ✅ Paid Months
            const paidMonths = memberFees
                .filter(f => f.paymentStatus === "paid")
                .map(f => ({
                month: f.month,
                paidAmount: f.paidAmount,
                collectedBy: f.collectedBy?.name || "N/A",
                dateOfPayment: f.dateOfPayment,
            }));
            const totalPaidAmount = paidMonths.reduce((a, b) => a + (b.paidAmount || 0), 0);
            // ⚠️ Pending Payments
            const pendingMonths = memberFees
                .filter(f => f.paymentStatus === "pending")
                .map(f => ({
                month: f.month,
                pendingAmount: f.pendingAmount,
                paidAmount: f.paidAmount,
            }));
            const totalPendingAmount = pendingMonths.reduce((a, b) => a + (b.pendingAmount || 0), 0);
            // ❌ Unpaid (months not found in fees)
            const paidOrPendingMonths = memberFees.map(f => f.month);
            const unpaidMonths = months
                .filter(m => !paidOrPendingMonths.includes(m))
                .map(m => ({ month: m, amountToPay: member.monthlyFee || 200 }));
            const totalAmountToPay = unpaidMonths.reduce((a, b) => a + (b.amountToPay || 0), 0);
            // 🎯 Logic per status
            if (status === "paid" && paidMonths.length > 0) {
                paidMembers.push({
                    ...memberInfo,
                    paidMonths,
                    totalPaidAmount,
                });
            }
            if (status === "pending" && pendingMonths.length > 0) {
                pendingMembers.push({
                    ...memberInfo,
                    pendingPayments: pendingMonths,
                    totalPendingAmount,
                });
            }
            if (status === "unpaid") {
                if (continuousUnpaid) {
                    // include only if ALL months are unpaid
                    if (unpaidMonths.length === months.length) {
                        unpaidMembers.push({
                            ...memberInfo,
                            unpaidMonths,
                            totalAmountToPay,
                        });
                    }
                }
                else if (unpaidMonths.length > 0) {
                    unpaidMembers.push({
                        ...memberInfo,
                        unpaidMonths,
                        totalAmountToPay,
                    });
                }
            }
        }
        // 🧩 Return unified structured response
        return {
            months,
            members: status === "paid"
                ? paidMembers
                : status === "unpaid"
                    ? unpaidMembers
                    : pendingMembers,
        };
    }
}
exports.FeeService = FeeService;
exports.default = new FeeService();
