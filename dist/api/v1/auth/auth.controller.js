"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const ApiResponse_1 = __importDefault(require("../../../utils/ApiResponse"));
const auth_service_1 = require("./auth.service");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const service = new auth_service_1.AuthService();
class AuthController {
    login = (0, catchAsync_1.default)(async (req, res) => {
        const result = await service.login(req.body);
        return ApiResponse_1.default.success(res, 'Login successful', result);
    });
}
exports.AuthController = AuthController;
exports.default = new AuthController();
