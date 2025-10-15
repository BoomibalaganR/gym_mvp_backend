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

    const existingGym = await Gym.findOne({
      $or: [{ name }, { email: owner_email }],
    });

    if (existingGym) {
      if (existingGym.name === name) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Gym with this name already exists');
      }
      if (existingGym.email === owner_email) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Gym with this email already exists');
      }
    }
    const gym = await Gym.create({ name, location, phone,email: owner_email, contact_person });

    const hashed = await bcrypt.hash(owner_password, 10);
    const owner = await Member.create({
      gym_id: gym._id,
      name: owner_name || contact_person,
      phone: owner_phone,
      email: owner_email,
      password: hashed,
      role: 'owner',
      can_access_bot: true,
      is_admin: true
    });

    if (owner_email) {
      // send onboard email (production SMTP configured)
      await this.emailService.sendGymOnboardEmail(owner_email, gym.name);
    }
    return { 'gym_id': gym._id };
  }

  async getGymById(id: string) {
    return Gym.findById(id);
  }
}
