import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';
import { NotificationService } from "../../../services/notification";
import ApiError from '../../../utils/ApiError';
import Member from '../member/member.model';

export class AuthService {
    NotificationService: any;
    
    constructor() {
    this.NotificationService = new NotificationService()
    }

    private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    async sendOtp(phone: string) {
        const otp = this.generateOtp();
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        const member = await Member.findOneAndUpdate(
            { phone },
            { otp, otp_expiry: expiry },
            { new: true }
        );

        if (!member) throw new ApiError(httpStatus.BAD_REQUEST, 'Member not found. Contact support to onboard.');

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
  async verifyOtp(phone: string, otp: string) {
    const member = await Member.findOne({ phone }).select('+otp +otp_expiry');
    if (!member) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Member not found.');
    }

    if (!member.otp || !member.otp_expiry) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No OTP found for this user.');
    }

    if (new Date() > member.otp_expiry) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'OTP expired. Please request a new one.');
    }

    if (member.otp !== otp) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP.');
    }

    // clear OTP after successful verification
    member.otp = undefined;
    member.otp_expiry = undefined;
    await member.save();

    return { message: 'OTP verified successfully.', member: member };
  }
  
  async login(payload: any) {
    const { logintype, action, phone, otp, email, password} = payload;

    if (logintype === 'email') {
      return this.loginWithEmail(email, password);
    } else if (logintype === 'phone') {
      if (action === 'send_otp') {
        return this.sendOtp(payload.phone);
      } else if (action === 'verify_otp') {
        return this.loginWithOtp(phone, otp);
      } else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid action for phone login');
      }
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid loginType');
    }
  }
  
  async loginWithEmail(email: string, password: string) {
    const member = await Member.findOne({ email }).select('+password');
    if (!member || !member.password) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Member not found');
    }

    const ok = await member.isPasswordMatch(password);
    if (!ok) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    const token = this._generateJwt(member, 'email');

    return {
      token,
      member: this._sanitizeMember(member),
    };
  }
 
  async loginWithOtp(phone: string, otp: string) {
    const {member} = await this.verifyOtp(phone, otp);
    const token = this._generateJwt(member, 'phone');
    return {
      token,
      member: this._sanitizeMember(member),
    };
  }


  private _generateJwt(member: any, loginType: string) {
    const payload = {
      id: member._id.toString(),
      gym_id: member.gym_id?.toString(),
      role: member.role,
      loginType, // <── added this
    };

   return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });

  }

  private _sanitizeMember(member: any) {
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
