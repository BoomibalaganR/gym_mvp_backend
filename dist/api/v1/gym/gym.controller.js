"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymController = void 0;
const ApiResponse_1 = __importDefault(require("../../../utils/ApiResponse"));
const gym_service_1 = require("./gym.service");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
class GymController {
    service;
    constructor() { this.service = new gym_service_1.GymService(); }
    onboard = (0, catchAsync_1.default)(async (req, res) => {
        const result = await this.service.createGymWithOwner(req.body);
        return ApiResponse_1.default.created(res, 'Gym onboarded', result);
    });
    get = (0, catchAsync_1.default)(async (req, res) => {
        const gym = await this.service.getGymById(req.params.id);
        return ApiResponse_1.default.success(res, 'Gym fetched', gym);
    });
    list = (0, catchAsync_1.default)(async (req, res) => {
        const gyms = await this.service.getGym();
        return ApiResponse_1.default.success(res, 'Gyms fetched', gyms);
    });
}
exports.GymController = GymController;
exports.default = new GymController();
