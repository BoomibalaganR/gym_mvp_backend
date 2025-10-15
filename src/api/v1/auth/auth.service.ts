import ApiError from '../../../utils/ApiError';
import Member from '../member/member.model';
import bcrypt from 'bcryptjs';
import { config } from '../../../config/env';
import httpStatus from 'http-status'
import jwt from 'jsonwebtoken';

export class AuthService {
  async login(email: string, password: string) {
    const member = await Member.findOne({ email }).select('+password');
    if (!member || !member.password) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Member not found');
    }

    const ok = await bcrypt.compare(password, member.password);
    if (!ok) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    const payload = {
      id: member._id.toString(),
      gym_id: member.gym_id?.toString(),
      role: member.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    const sanitizedMember = {
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      gym_id: member.gym_id,
      role: member.role,
      is_admin: member.is_admin,
    };

    return { token, member: sanitizedMember };

  }
}

