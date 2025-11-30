"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const member_model_1 = __importDefault(require("../member/member.model"));
const notification_1 = require("../../../services/notification");
const env_1 = require("../../../config/env");
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    NotificationService;
    constructor() {
        this.NotificationService = new notification_1.NotificationService();
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendOtp(phone) {
        const otp = this.generateOtp();
        const expiry = new Date(Date.now() + 5 * 60 * 1000);
        const member = await member_model_1.default.findOneAndUpdate({ phone }, { otp, otp_expiry: expiry }, { new: true });
        if (!member)
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Member not found. Contact support to onboard.');
        await this.NotificationService.send({
            sms: {
                payload: {
                    to: phone,
                    templateName: "otp",
                    context: {
                        name: member.getFullName(),
                        otp: otp
                    },
                }
            }
        });
        return { message: 'OTP sent successfully' };
    }
    // Verify OTP logic centralized here
    async verifyOtp(phone, otp) {
        const member = await member_model_1.default.findOne({ phone }).select('+otp +otp_expiry');
        if (!member) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Member not found.');
        }
        if (!member.otp || !member.otp_expiry) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'No OTP found for this user.');
        }
        if (new Date() > member.otp_expiry) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'OTP expired. Please request a new one.');
        }
        if (member.otp !== otp) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid OTP.');
        }
        // clear OTP after successful verification
        member.otp = undefined;
        member.otp_expiry = undefined;
        await member.save();
        return { message: 'OTP verified successfully.', member: member };
    }
    async login(payload) {
        const { logintype, action, phone, otp, email, password } = payload;
        if (logintype === 'email') {
            return this.loginWithEmail(email, password);
        }
        else if (logintype === 'phone') {
            if (action === 'send_otp') {
                return this.sendOtp(payload.phone);
            }
            else if (action === 'verify_otp') {
                return this.loginWithOtp(phone, otp);
            }
            else {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid action for phone login');
            }
        }
        else {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid loginType');
        }
    }
    async loginWithEmail(email, password) {
        const member = await member_model_1.default.findOne({ email }).select('+password');
        if (!member || !member.password) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Member not found');
        }
        const ok = await member.isPasswordMatch(password);
        if (!ok) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid credentials');
        }
        const token = this._generateJwt(member, 'email');
        return {
            token,
            member: this._sanitizeMember(member),
        };
    }
    async loginWithOtp(phone, otp) {
        const { member } = await this.verifyOtp(phone, otp);
        const token = this._generateJwt(member, 'phone');
        return {
            token,
            member: this._sanitizeMember(member),
        };
    }
    _generateJwt(member, loginType) {
        const payload = {
            id: member._id.toString(),
            gym_id: member.gym_id?.toString(),
            role: member.role,
            loginType, // <── added this
        };
        return jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, {
            expiresIn: env_1.config.jwtExpiresIn,
        });
    }
    _sanitizeMember(member) {
        return {
            id: member._id.toString(),
            name: member.getFullName?.(),
            email: member.email,
            phone: member.phone,
            gym_id: member.gym_id,
            role: member.role,
            is_admin: member.is_admin,
        };
    }
}
exports.AuthService = AuthService;
