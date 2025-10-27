import { format, subMonths } from 'date-fns';

import ApiError from '../../../utils/ApiError';
import Fee from './fee.model';
import Member from '../member/member.model'
import { parseISO } from 'date-fns';

export class FeeService {
  // ✅ Create fee with partial payments and bulk insert
  async createFee(gym: any, user: any, memberId: any, payload: any) {
    const member = await Member.findOne({ _id: memberId, gym: gym._id }).select("-password");
    if (!member) throw new ApiError(404, "Member not found");

    const gymFee = gym.monthlyFee;
    const { amount: totalPaid, months, paymentType, transactionId } = payload;

    // Fetch existing fees
    const existingFees = await Fee.find({ gym, member, month: { $in: months } });
    const existingMonths = existingFees.map(f => f.month);

    let remainingAmount = totalPaid;
    const newFees: any[] = [];

    for (const month of months) {
      if (existingMonths.includes(month)) continue;

      let paidAmount = 0;
      let pendingAmount = gymFee;
      let paymentStatus: "full" | "pending" = "pending";
      console.log({ remainingAmount, gymFee });
      if (remainingAmount >= gymFee) {
        paidAmount = gymFee;
        pendingAmount = 0;
        paymentStatus = "full";
        remainingAmount -= gymFee;
      } else if (remainingAmount > 0) {
        paidAmount = remainingAmount;
        pendingAmount = gymFee - remainingAmount;
        remainingAmount = 0;
      }

      newFees.push({
        gym,
        member,
        month,
        paidAmount,
        pendingAmount,
        paymentStatus,
        paymentType,
        collectedBy: user._id,
        dateOfPayment: new Date(),
        transactionId
      });
    }

    const insertedFees = await Fee.insertMany(newFees);

    return {
      created: insertedFees.map(f => ({
        fee_id: f._id,
        month: f.month,
        paidAmount: f.paidAmount,
        pendingAmount: f.pendingAmount,
        paymentStatus: f.paymentStatus
      })),
      alreadyPaidMonths: months.filter(m => existingMonths.includes(m))
    };
  }

  // ✅ Get fees by date range (owner view)
  async getFeesByDateRange(gym: any, user: any, query: any) {
    const { start, end , verifiedByOwner, paymentType, paymentStatus } = query;
    if (!start || !end) throw new ApiError(400, "start and end dates required");
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const filter: any = {
      gym: gym._id,
      dateOfPayment: { $gte: new Date(startDate), $lt: new Date(endDate) }
    };
    if (verifiedByOwner !== undefined) filter.verifiedByOwner = verifiedByOwner; 
    if (paymentType) filter.paymentType = paymentType; 
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    const fees = await Fee.find(filter)
      .populate("member", "name nickname phone")
      .sort({ dateOfPayment: 1 });

    return fees.map(f => ({
      fee_id: f._id,
      month: f.month,
      paidAmount: f.paidAmount,
      pendingAmount: f.pendingAmount,
      paymentStatus: f.paymentStatus,
      member: f.member,
      dateOfPayment: f.dateOfPayment
    }));
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
      profile_url: await member.getProfilePicUrl(),
    };

    // ✅ Paid Months
    const paidMonths = memberFees
      .filter(f => f.paymentStatus === "full")
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
