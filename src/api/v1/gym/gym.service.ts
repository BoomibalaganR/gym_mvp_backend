import ApiError from '../../../utils/ApiError';
import { EmailService } from '../../../services/email.service';
import Gym from './gym.model';
import Member from '../member/member.model';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status'

export class GymService {
  emailService: EmailService;
  constructor() {
    this.emailService = new EmailService();
  }

async createGymWithOwner(payload: any) {
  const { name, location, phone, contact_person, owner_name, owner_phone, owner_password, owner_email } = payload;

  let gym: any = null;
  let owner: any = null;

  try {
    // Check if Gym exists
    const existingGym = await Gym.findOne({ $or: [{ name }, { email: owner_email }] });
    if (existingGym) {
      if (existingGym.name === name) throw new ApiError(httpStatus.BAD_REQUEST, 'Gym with this name already exists');
      if (existingGym.email === owner_email) throw new ApiError(httpStatus.BAD_REQUEST, 'Gym with this email already exists');
    }

    // Create Gym
    gym = await Gym.create({ name, location, phone, email: owner_email, contact_person });

    // Check if Owner already exists
    const existingMember = await Member.findOne({ phone: owner_phone });
    if (existingMember) throw new ApiError(httpStatus.BAD_REQUEST, 'Owner with this phone number already exists');

    // Create Owner
    owner = await Member.create({
      gym: gym._id,
      name: owner_name || contact_person,
      phone: owner_phone,
      email: owner_email,
      password: owner_password, // hashed via pre-save middleware
      role: 'owner',
      can_access_bot: true,
      is_admin: true
    });

    // Send onboard email if email exists
    if (owner_email) {
      await this.emailService.sendGymOnboardEmail(owner_email, gym.name);
    }

    return { gym_id: gym._id };

  } catch (error) {
    // Manual rollback
    if (owner && owner._id) {
      await Member.deleteOne({ _id: owner._id }).catch(err => console.error('Rollback owner failed:', err));
    }
    if (gym && gym._id) {
      await Gym.deleteOne({ _id: gym._id }).catch(err => console.error('Rollback gym failed:', err));
    }

    throw error;
  }
}
 async getGym() {
    return Gym.find();
  }
  async getGymById(id: string) {
    return Gym.findById(id);
  }
}
