"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGymSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createGymSchema = {
    body: joi_1.default.object({
        name: joi_1.default.string().required().messages({
            'string.empty': 'Gym name is required',
            'any.required': 'Gym name is required'
        }),
        location: joi_1.default.string().required().messages({
            'string.empty': 'Location is required',
            'any.required': 'Location is required'
        }),
        phone: joi_1.default.string().pattern(/^\d{10}$/).messages({
            'string.empty': 'Gym phone number is required',
            'string.pattern.base': 'Phone must be 10 digits',
            'any.required': 'Gym phone number is required'
        }),
        contact_person: joi_1.default.string().required().messages({
            'string.empty': 'Contact person is required',
            'any.required': 'Contact person is required'
        }),
        owner_name: joi_1.default.string().required().messages({
            'string.empty': 'Owner name is required',
            'any.required': 'Owner name is required'
        }),
        owner_phone: joi_1.default.string().pattern(/^\d{10}$/).required().messages({
            'string.empty': 'Owner phone is required',
            'string.pattern.base': 'Owner phone must be 10 digits',
            'any.required': 'Owner phone is required'
        }),
        owner_email: joi_1.default.string().email().required().messages({
            'string.empty': 'Owner email is required',
            'string.email': 'Owner email must be valid',
            'any.required': 'Owner email is required'
        }),
        owner_password: joi_1.default.string().min(6).messages({
            'string.empty': 'Owner password is required',
            'string.min': 'Owner password must be at least 6 characters',
            'any.required': 'Owner password is required'
        })
    }).options({ abortEarly: false })
};
