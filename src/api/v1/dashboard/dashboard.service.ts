import Fee from '../fee/fee.model';
import Member from '../member/member.model';
import { format } from 'date-fns';

export class DashboardService {

 // ✅ Dashboard Summary
async getDashboardSummary(gym: any, user: any, query: any) {
  const month = query.month || format(new Date(), "yyyy-MM");

  // 🧮 Step 1: Member counts
  const [totalMembers, activeMembers] = await Promise.all([
    Member.countDocuments({ gym: gym._id , is_admin: { $ne: true } }),
    Member.countDocuments({ gym: gym._id, is_admin: { $ne: true }, is_active: true }),
  ]);

  // 🧮 Step 2: Fetch fees of the month
  const fees = await Fee.find({ gym: gym._id, month });

  let totalCollected = 0;
  let totalPending = 0;
  let pendingMemberCount = 0;
  let paidMemberCount = 0;
  const memberIdsWithFees = new Set();

  for (const fee of fees) {
    memberIdsWithFees.add(fee.member.toString());
    
    if (fee.paymentStatus === "full") {
      totalCollected += fee.paidAmount;
        paidMemberCount += 1;
    } else if (fee.paymentStatus === "pending") {
      totalCollected += fee.paidAmount;
      totalPending += fee.pendingAmount;
      pendingMemberCount += 1;
    }
  }

  // 🧮 Step 3: Find unpaid members
  const totalUnpaidMembers = await Member.countDocuments({
    gym: gym._id,
    _id: { $nin: Array.from(memberIdsWithFees) },
    is_admin: { $ne: true }
  });

  // 🎯 Step 4: Return summary
  return {
    month,
    totalMembers,
    activeMembers,
    totalCollected,
    totalPending,
    totalUnpaidMembers,
    totalPaidMembers: paidMemberCount,
    pendingMembers: pendingMemberCount,
  };
}


}
export default new DashboardService();
