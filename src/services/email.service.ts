import { config } from '../config/env';
import nodemailer from 'nodemailer';

export class EmailService {
  transporter: any;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: `"GymApp" <${config.appEmail}>`,
      to,
      subject,
      html
    });
    console.log(`📨 Email sent: ${info.messageId}`);
    return info;
  }

  async sendGymOnboardEmail(to: string, gymName: string) {
    const html = `<h3>Welcome to ${gymName}</h3><p>Your gym is onboarded successfully.</p>`;
    // return this.sendMail(to, `Welcome to ${gymName}`, html);
    console.log("welcome email sended....!!")
  }
}
