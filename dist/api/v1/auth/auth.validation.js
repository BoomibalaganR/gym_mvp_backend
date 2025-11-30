"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.loginSchema = {
    body: joi_1.default.object({
        logintype: joi_1.default.string().valid('email', 'phone').required().messages({
            'any.required': 'Please specify login type.',
            'any.only': 'Login type must be either email or phone.'
        }),
        // email login fields
        email: joi_1.default.string().email().when('logintype', {
            is: 'email',
            then: joi_1.default.required().messages({
                'any.required': 'Email is required for email login.',
                'string.email': 'Please enter a valid email address.'
            }),
            otherwise: joi_1.default.forbidden()
        }),
        password: joi_1.default.string().when('logintype', {
            is: 'email',
            then: joi_1.default.required().messages({
                'any.required': 'Password is required for email login.'
            }),
            otherwise: joi_1.default.forbidden()
        }),
        // phone login fields
        phone: joi_1.default.string()
            .pattern(/^\d{10}$/)
            .when('logintype', {
            is: 'phone',
            then: joi_1.default.required().messages({
                'any.required': 'phone number is required for phone login.',
                'string.pattern.base': 'Please enter a valid 10-digit phone number.'
            }),
            otherwise: joi_1.default.forbidden()
        }),
        action: joi_1.default.string()
            .valid('send_otp', 'verify_otp')
            .when('logintype', {
            is: 'phone',
            then: joi_1.default.required().messages({
                'any.required': 'Action is required for phone login (send_otp or verify_otp).'
            }),
            otherwise: joi_1.default.forbidden()
        }),
        otp: joi_1.default.string()
            .length(6)
            .pattern(/^\d{6}$/)
            .when('action', {
            is: 'verify_otp',
            then: joi_1.default.required().messages({
                'any.required': 'OTP is required for verification.',
                'string.pattern.base': 'OTP must be 6 digits.'
            }),
            otherwise: joi_1.default.forbidden()
        })
    })
};
