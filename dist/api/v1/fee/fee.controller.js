"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeController = void 0;
const ApiResponse_1 = __importDefault(require("../../../utils/ApiResponse"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const fee_service_1 = __importDefault(require("./fee.service"));
class FeeController {
    create = (0, catchAsync_1.default)(async (req, res) => {
        const fees = await fee_service_1.default.createFee(req.gym, req.user, req.params.memberId, req.body);
        return ApiResponse_1.default.created(res, 'Fee created', fees);
    });
    list = (0, catchAsync_1.default)(async (req, res) => {
        const fees = await fee_service_1.default.getFeesByDateRange(req.gym, req.user, req.query);
        return ApiResponse_1.default.success(res, 'Fees retrieved', fees);
    });
    updateVerified = (0, catchAsync_1.default)(async (req, res) => {
        const fee = await fee_service_1.default.verifyFeesByIds(req.gym, req.user, req.body);
        return ApiResponse_1.default.success(res, 'Fee verification updated', fee);
    });
    markPendingAsPaid = (0, catchAsync_1.default)(async (req, res) => {
        const result = await fee_service_1.default.markPendingFeeAsPaid(req.gym, req.user, req.body);
        return ApiResponse_1.default.success(res, "Pending fee updated as paid", result);
    });
    getLastNMonthsMemberPaymentStatus = (0, catchAsync_1.default)(async (req, res) => {
        const result = await fee_service_1.default.getMembersFeeReport(req.gym, req.user, req.query);
        return ApiResponse_1.default.success(res, 'Member payment status retrieved', result);
    });
}
exports.FeeController = FeeController;
exports.default = new FeeController();
