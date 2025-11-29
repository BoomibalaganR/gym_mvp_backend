import { endOfMonth, format, parseISO, startOfMonth, subMonths } from 'date-fns';

import ApiError from '../../../utils/ApiError';
import Member from '../member/member.model';
import Fee from './fee.model';

export class FeeService {
  // ✅ Create fee with partial payments and bulk insert
  async createFee(gym: any, user: any, memberId: string, payload: any) {
  // 1. Validate member
  const member = await Member.findOne({ _id: memberId, gym: gym._id }).select("-password");
  if (!member) throw new ApiError(404, "Member not found");

  // 2. Extract payload
  const gymMonthlyFee = gym.monthlyFee || 200;
  const { amount: totalPaid, months, paymentType, transactionId } = payload;

  // Convert input months → normalized Date
  const normalizedMonths = months.map(m => {
    const [year, month] = m.split("-");
    return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  });

  // 3. Fetch existing fees already paid for these months
  const existingFees = await Fee.find({
    gym: gym._id,
    member: member._id,
    month: { $in: normalizedMonths }
  });

  const existingMonthDates = existingFees.map(f => f.month.getTime());

  // 4. Prepare new fee records
  let remainingAmount = totalPaid;
  const newFeeRecords: any[] = [];

  for (let i = 0; i < normalizedMonths.length; i++) {
    const monthDate = normalizedMonths[i];

    // Skip if already exists
    if (existingMonthDates.includes(monthDate.getTime())) continue;

    let paidAmount = 0;
    let pendingAmount = gymMonthlyFee;
    let paymentStatus: "paid" | "pending" = "pending";

    // Logic: Deduct fee for each month from remainingAmount
    if (remainingAmount >= gymMonthlyFee) {
      paidAmount = gymMonthlyFee;
      pendingAmount = 0;
      paymentStatus = "paid";
      remainingAmount -= gymMonthlyFee;
    } else if (remainingAmount > 0) {
      paidAmount = remainingAmount;
      pendingAmount = gymMonthlyFee - remainingAmount;
      remainingAmount = 0;
      paymentStatus = "pending";
    }

    newFeeRecords.push({
      gym: gym._id,
      member: member._id,
      month: monthDate,
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
  const insertedFees = await Fee.insertMany(newFeeRecords);

  // 6. Prepare clean response
  return {
    created: insertedFees.map(fee => ({
      fee_id: fee._id,
      month: fee.month,
      paidAmount: fee.paidAmount,
      pendingAmount: fee.pendingAmount,
      paymentStatus: fee.paymentStatus
    })),
    alreadyPaidMonths: normalizedMonths.filter(m =>
      existingMonthDates.includes(m.getTime())
    )
  };
}

async getUnpaidMonth(memberId: string) {
  // 1. Get member
  const member = await Member.findOne({ _id: memberId }).select("+createdAt");
  if (!member) throw new ApiError(404, "Member not found");

  // Normalize member.createdAt to first day of that month
  const created = new Date(member.createdAt);
  const startYear = created.getFullYear();
  const startMonth = created.getMonth(); // 0–11

  // 2. Fetch all paid months (Date objects)
  const paidFees = await Fee.find({ member: memberId }).select("month");

  // Convert them into "YYYY-MM" strings
  const paidMonths = new Set(
    paidFees.map(f => format(new Date(f.month), "yyyy-MM"))
  );

  // 3. Generate all months from createdAt → today
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const allMonths: string[] = [];

  let y = startYear;
  let m = startMonth;

  while (y < currentYear || (y === currentYear && m <= currentMonth)) {
    const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
    allMonths.push(monthStr);

    // increment month
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  // 4. Filter out paid months
  const unpaidMonths = allMonths.filter(month => !paidMonths.has(month));
  
  return {
    memberId,
    createdAt: created,
    paidMonths: Array.from(paidMonths),
    unpaidMonths: Array.from(unpaidMonths)
  };
}


async getFeesByDateRange(gym: any, user: any, query: any) {
  const { start, end, verifiedByOwner, paymentType, paymentStatus, memberId, months } = query;

  const filter: any = { gym: gym._id };

  // Member filter
  if (memberId) filter.member = memberId;

  // Verified / Payment filters
  if (verifiedByOwner !== undefined) filter.verifiedByOwner = verifiedByOwner === "true" || verifiedByOwner === true;
  if (paymentType) filter.paymentType = paymentType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  // Date filter
  let limit: number | undefined;
  if (months && memberId) {
    // Last N paid months for the member
    limit = Number(months);
    if (isNaN(limit) || limit <= 0) throw new ApiError(400, "Invalid months value");
  } else {
    // Start / end date range
    if (!start || !end) throw new ApiError(400, "start and end dates required");
    const startDate = startOfMonth(parseISO(start));
    const endDate = endOfMonth(parseISO(end));
    filter.dateOfPayment = { $gte: startDate, $lte: endDate };
  }

  // Build query
  let queryBuilder = Fee.find(filter)
    .populate([
      { path: "member", select: "first_name last_name nickname phone" },
      { path: "collectedBy", select: "first_name last_name phone" }
    ]);

  // Sorting
  if (months && memberId) queryBuilder = queryBuilder.sort({ month: -1 }); // latest paid first
  else queryBuilder = queryBuilder.sort({ dateOfPayment: 1 }); // owner view

  // Limit if last N months
  if (limit) queryBuilder = queryBuilder.limit(limit);

  const fees = await queryBuilder;

  // Map response with fullName
  return {
    count: fees.length,
    data: fees.map(fee => ({
      id: fee._id, 
      month: fee.month,
      totalAmount: gym.monthlyFee || 200,
      paidAmount: fee.paidAmount,
      pendingAmount: fee.pendingAmount,
      paymentStatus: fee.paymentStatus,
      paymentType: fee.paymentType,
      verifiedByOwner: fee.verifiedByOwner,
      member: fee.member
        ? { id: fee.member.id, name: fee.member.getFullName(), phone: fee.member.phone }
        : null,
      dateOfPayment: fee.dateOfPayment,
      collectedBy: fee.collectedBy
        ? { id: fee.collectedBy.id, name: fee.collectedBy.getFullName()}
        : null
    }))
  };
}





  // ✅ Mark multiple fees as verified by owner
  async verifyFeesByIds(gym: any, user: any, payload: any) {
    const { feeIds } = payload;
    if (!feeIds || feeIds.length === 0) throw new ApiError(400, "No fees selected");

    const fees = await Fee.find({ _id: { $in: feeIds }, gym: gym._id });
    if (!fees || fees.length === 0) throw new ApiError(404, "Fees not found");

    const verifiedFees: any[] = [];
    const alreadyVerifiedIds: string[] = [];

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


 async  getMembersFeeReport(gym: any, user: any, query: any) {
  const { status, month, monthsCount = 0, continuousUnpaid = false } = query;

  const today = new Date();
  let months: string[] = [];

  // 🗓️ Build month list
  if (month) months = [month];
  else if (monthsCount > 0) {
    for (let i = 1; i <= monthsCount; i++) {
      months.push(format(subMonths(today, i), "yyyy-MM"));
    }
  } else months = [format(today, "yyyy-MM")];

  // 🧾 Get all active members
  const members = await Member.find({
    gym: gym._id,
    role: { $ne: "owner" },
  });

  // 🧾 Get all fee records for these months
  const fees = await Fee.find({
    gym: gym._id,
    month: { $in: months },
  }).populate("collectedBy", "name");

  const feeMap = new Map();
  for (const f of fees) {
    if (!feeMap.has(f.member.toString())) feeMap.set(f.member.toString(), []);
    feeMap.get(f.member.toString()).push(f);
  }

  const paidMembers: any[] = [];
  const unpaidMembers: any[] = [];
  const pendingMembers: any[] = [];

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
      } else if (unpaidMonths.length > 0) {
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
    members:
      status === "paid"
        ? paidMembers
        : status === "unpaid"
        ? unpaidMembers
        : pendingMembers,
  };
}


}


export default new FeeService();
