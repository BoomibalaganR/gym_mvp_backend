"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const GymSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    location: { type: String },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: false },
    contact_person: { type: String },
    branches: [{ name: String, address: String }],
    monthlyFee: { type: Number, required: true, default: 0 }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Gym', GymSchema);
