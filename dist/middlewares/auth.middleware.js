"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authenticateUser;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const gym_model_1 = __importDefault(require("../api/v1/gym/gym.model"));
const member_model_1 = __importDefault(require("../api/v1/member/member.model"));
const env_1 = require("../config/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function authenticateUser(req, _res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next(new ApiError_1.default(401, 'Unauthorized'));
    }
    const token = header.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        // 🔹 Fetch the full member object (exclude password)
        const member = await member_model_1.default.findOne({ _id: decoded.id })
            .select('-password')
            .populate('gym');
        if (!member)
            return next(new ApiError_1.default(401, 'Member not found'));
        // 🔹 Fetch the associated gym object
        const gym = await gym_model_1.default.findById(member.gym);
        if (!gym)
            return next(new ApiError_1.default(401, 'Gym not found'));
        // 🔹 Attach both objects to request
        req.user = member;
        req.gym = gym;
        next();
    }
    catch (err) {
        console.error('Authentication error:', err);
        return next(new ApiError_1.default(401, 'Invalid or expired token'));
    }
}
