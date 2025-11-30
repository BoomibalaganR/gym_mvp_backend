"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authorize;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user)
            return next(new ApiError_1.default(401, 'Unauthorized'));
        if (allowedRoles.length && !allowedRoles.includes(user.role)) {
            return next(new ApiError_1.default(403, 'Forbidden: insufficient role'));
        }
        next();
    };
}
