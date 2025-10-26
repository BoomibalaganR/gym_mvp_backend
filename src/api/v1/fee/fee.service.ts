import { format, subMonths } from 'date-fns';

import ApiError from '../../../utils/ApiError';
import Fee from './fee.model';
import Member from '../member/member.model'
import mongoose from 'mongoose';
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

 // ✅ Get last N months paid/unpaid member list
async getLastNMonthsMembers(gym: any, user: any, query: any) { 
   //TODO: need to work on aggregation for paid and unpaid list 
  const { monthsCount = 0, status } = query;
  if (monthsCount < 0) throw new ApiError(400, "monthsCount must be >= 0");

  const today = new Date();
  const months: string[] = [];

  // 🗓️ Build list of target months (current or last N months)
  if (monthsCount === 0) {
    months.push(format(today, "yyyy-MM"));
  } else {
    for (let i = 1; i <= monthsCount; i++) {
      months.push(format(subMonths(today, i), "yyyy-MM"));
    }
  }

  // 🧩 Build aggregation
  const pipeline: any[] = [
    { $match: { gym: new mongoose.Types.ObjectId(gym._id), role: { $ne: "owner" } } },
    {
      $lookup: {
        from: "fees",
        let: { memberId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$member", "$$memberId"] },
                  { $in: ["$month", months] },
                ],
              },
            },
          },
          {
            $project: {
              month: 1,
              paymentStatus: 1,
              paidAmount: 1,
              pendingAmount: 1,
              collectedBy: 1,
              createdAt: 1,
            },
          },
        ],
        as: "fees",
      },
    },
    {
      $addFields: {
  totalPaidAmount: { $sum: "$fees.paidAmount" },
  totalPendingAmount: { $sum: "$fees.pendingAmount" },
  paidMonths: {
    $map: {
      input: {
        $filter: {
          input: "$fees",
          as: "f",
          cond: { $eq: ["$$f.paymentStatus", "full"] }, // ✅ FIXED
        },
      },
      as: "f",
      in: {
        month: "$$f.month",
        paidAmount: "$$f.paidAmount",
        collectedBy: "$$f.collectedBy",
        paidDate: "$$f.dateOfPayment",
      },
    },
  },
  unpaidMonths: {
    $map: {
      input: {
        $filter: {
          input: "$fees",
          as: "f",
          cond: {
            $or: [
              { $eq: ["$$f.paymentStatus", "pending"] },
              { $eq: ["$$f.paymentStatus", "unpaid"] },
            ],
          },
        },
      },
      as: "f",
      in: {
        month: "$$f.month",
        pendingAmount: "$$f.pendingAmount",
      },
    },
  },
},

    },
  ];

  // 🎯 Apply filter based on status
  if (status === "paid") {
    pipeline.push({ $match: { "paidMonths.0": { $exists: true } } });
  } else if (status === "unpaid") {
    pipeline.push({ $match: { $or: [{ "unpaidMonths.0": { $exists: true } }, { totalPendingAmount: { $gt: 0 } }] } });
  }

  // 🧾 Final shape
  pipeline.push({
    $project: {
      member_id: "$_id",
      name: 1,
      nickname: 1,
      phone: 1,
      totalPaidAmount: 1,
      totalPendingAmount: 1,
      paidMonths: 1,
      unpaidMonths: 1,
    },
  });

  // 🚀 Run aggregation
  const members = await Member.aggregate(pipeline);
  return { months, members };
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
}

export default new FeeService();
