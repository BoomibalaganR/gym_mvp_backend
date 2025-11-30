"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const ApiResponse_1 = __importDefault(require("../../../utils/ApiResponse"));
const dashboard_service_1 = __importDefault(require("./dashboard.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
class DashboardController {
    getDashboardSummary = (0, catchAsync_1.default)(async (req, res) => {
        const summary = await dashboard_service_1.default.getDashboardSummary(req.gym, req.user, req.query);
        return ApiResponse_1.default.success(res, 'Dashboard summary retrieved', summary);
    });
}
exports.DashboardController = DashboardController;
exports.default = new DashboardController();
