"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberSchema = exports.createMemberSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createMemberSchema = {
    body: joi_1.default.object({
        first_name: joi_1.default.string().trim().min(2).max(50).required().messages({
            'string.empty': 'Member first_name is required',
            'string.min': 'Member first_name must be at least 2 characters',
            'string.max': 'Member first_name must be at most 50 characters',
            'any.required': 'Member first_name is required'
        }),
        last_name: joi_1.default.string().trim().min(1).max(50).messages({
            'string.empty': 'Member first_name is required',
            'string.min': 'Member last_name must be at least 2 characters',
            'string.max': 'Member last_name must be at most 50 characters',
            'any.required': 'Member last_name is required'
        }),
        phone: joi_1.default.string().pattern(/^\d{10}$/).required().messages({
            'string.empty': 'Member phone number is required',
            'string.pattern.base': 'Phone must be 10 digits',
            'any.required': 'Member phone number is required'
        }),
        nickname: joi_1.default.string().trim().max(30).optional().allow(null, '').messages({
            'string.max': 'Nick name must be at most 30 characters'
        }),
        referred_by: joi_1.default.string()
            .hex()
            .length(24)
            .optional()
            .allow(null, '')
            .messages({
            'string.base': '"referred_by" must be a string',
            'string.length': '"referred_by" must be a valid 24-character ObjectId',
            'string.hex': '"referred_by" must be a valid hex string'
        }),
        address: joi_1.default.string().trim().max(200).optional().allow(null, '').messages({
            'string.max': 'Address must be at most 200 characters'
        }),
        working_status: joi_1.default.string().valid('active', 'inactive').optional().allow(null, '').messages({
            'any.only': 'Working status must be either active or inactive'
        }),
        session: joi_1.default.string().valid('morning', 'evening').optional().allow(null, '').messages({
            'any.only': 'Session must be either morning or evening'
        }),
        gender: joi_1.default.string().valid('male', 'female', 'other').optional().allow(null, '').messages({
            'any.only': 'Gender must be either male, female, or other'
        }),
        branch: joi_1.default.string().trim().max(50).optional().allow(null, '').messages({
            'string.max': 'Branch must be at most 50 characters'
        }),
        password: joi_1.default.string()
            .allow(null, '')
            .min(6)
            .max(20)
            .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/)
            .messages({
            'string.min': 'Password must be at least 6 characters',
            'string.max': 'Password must be at most 20 characters',
            'string.pattern.base': 'Password must contain at least one letter and one number',
        }),
    }).options({ stripUnknown: true, abortEarly: true })
};
exports.updateMemberSchema = {
    body: joi_1.default.object({
        first_name: joi_1.default.string().trim().min(2).max(50).messages({
            'string.empty': 'Member first_name is required',
            'string.min': 'Member first_name must be at least 2 characters',
            'string.max': 'Member first_name must be at most 50 characters',
            'any.required': 'Member first_name is required'
        }),
        last_name: joi_1.default.string().trim().min(1).max(50).messages({
            'string.empty': 'Member last_name is required',
            'string.min': 'Member last_name must be at least 1 character',
            'string.max': 'Member last_name must be at most 50 characters',
            'any.required': 'Member last_name is required'
        }),
        nickname: joi_1.default.string().trim().max(30).optional().allow(null, '').messages({
            'string.max': 'Nick name must be at most 30 characters'
        }),
        referred_by: joi_1.default.string()
            .length(24)
            .allow(null, '')
            .hex()
            .optional()
            .messages({
            'string.base': '"referred_by" must be a string',
            'string.length': '"referred_by" must be a valid 24-character ObjectId',
            'string.hex': '"referred_by" must be a valid hex string'
        }),
        address: joi_1.default.string().trim().max(200).optional().allow(null, '').messages({
            'string.max': 'Address must be at most 200 characters'
        }),
        working_status: joi_1.default.string().valid('active', 'inactive').optional().allow(null, '').messages({
            'any.only': 'Working status must be either active or inactive'
        }),
        session: joi_1.default.string().valid('morning', 'evening').optional().allow(null, '').messages({
            'any.only': 'Session must be either morning or evening'
        }),
        gender: joi_1.default.string().valid('male', 'female', 'other').optional().allow(null, '').messages({
            'any.only': 'Gender must be either male, female, or other'
        }),
        branch: joi_1.default.string().trim().max(50).optional().allow(null, '').messages({
            'string.max': 'Branch must be at most 50 characters'
        }),
        is_active: joi_1.default.boolean().optional().messages({
            'boolean.base': 'is_active must be a boolean value'
        }),
    }).options({ stripUnknown: true, abortEarly: true })
};
