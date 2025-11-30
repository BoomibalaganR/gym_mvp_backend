import { NextFunction, Response } from 'express';

import { Request } from 'express';
import jwt from 'jsonwebtoken';
import Gym from '../api/v1/gym/gym.model';
import Member from '../api/v1/member/member.model';
import { config } from '../config/env';
import ApiError from '../utils/ApiError';

export interface AuthenticatedRequest extends Request {
  user?: any;  // Full member object or sanitized version
  gym?: any;   // Full gym object or sanitized version
}

export default async function authenticateUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    // 🔹 Fetch the full member object (exclude password)
    const member = await Member.findOne({ _id: decoded.id})
    .select('-password')
    .populate('gym');

    if (!member) return next(new ApiError(401, 'Member not found'));

    // 🔹 Fetch the associated gym object
    const gym = await Gym.findById(member.gym);
    if (!gym) return next(new ApiError(401, 'Gym not found'));

    // 🔹 Attach both objects to request
    req.user = member;
    req.gym = gym;

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}
