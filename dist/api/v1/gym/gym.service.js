"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymService = void 0;
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const gym_model_1 = __importDefault(require("./gym.model"));
const member_model_1 = __importDefault(require("../member/member.model"));
const notification_1 = require("../../../services/notification");
const http_status_1 = __importDefault(require("http-status"));
class GymService {
    NotificationService;
    constructor() {
        this.NotificationService = new notification_1.NotificationService();
    }
    async createGymWithOwner(payload) {
        const { name, location, phone, contact_person, owner_name, owner_phone, owner_password, owner_email } = payload;
        console.log(payload);
        let gym = null;
        let owner = null;
        try {
            // Check if Gym exists
            const existingGym = await gym_model_1.default.findOne({ $or: [{ name }, { phone: owner_phone }] });
            if (existingGym) {
                if (existingGym.name === name)
                    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Gym with this name already exists');
                if (existingGym.phone === owner_phone)
                    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Gym with this phone number already exists');
                if (existingGym.email === owner_email)
                    throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Gym with this email already exists');
            }
            // Create Gym
            gym = await gym_model_1.default.create({ name, location, phone: owner_phone, email: owner_email, contact_person });
            // Check if Owner already exists
            const existingMember = await member_model_1.default.findOne({ phone: owner_phone }).countDocuments();
            if (existingMember)
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Owner with this phone number already exists');
            // Create Owner
            owner = await member_model_1.default.create({
                gym: gym._id,
                first_name: owner_name || contact_person,
                phone: owner_phone,
                email: owner_email,
                password: owner_password, // hashed via pre-save middleware
                role: 'owner',
                can_access_bot: true,
                is_admin: true
            });
            // Send onboard email if email exists
            if (owner_email) {
                const payload = {
                    to: owner_email,
                    subject: `🎉 Welcome to GymFlow — ${gym.name} is now onboarded!`,
                    template: 'onboard', // could be used in future for HTML templates
                    data: {
                        owner_name: owner_name,
                        gym_name: gym.name,
                    },
                };
                await this.NotificationService.send({
                    email: {
                        payload: payload
                    }
                });
            }
            return { gym_id: gym._id };
        }
        catch (error) {
            // Manual rollback
            if (owner && owner._id) {
                await member_model_1.default.deleteOne({ _id: owner._id }).catch(err => console.error('Rollback owner failed:', err));
            }
            if (gym && gym._id) {
                await gym_model_1.default.deleteOne({ _id: gym._id }).catch(err => console.error('Rollback gym failed:', err));
            }
            throw error;
        }
    }
    async getGym() {
        return gym_model_1.default.find();
    }
    async getGymById(id) {
        return gym_model_1.default.findById(id);
    }
}
exports.GymService = GymService;
