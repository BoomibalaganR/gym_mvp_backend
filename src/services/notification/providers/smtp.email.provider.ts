import { BaseProvider } from "./base.provider";
import { EmailPayload } from "../interfaces/payload.interface";
import { EmailTemplates } from "../templates/email.template";
import nodemailer from "nodemailer";

export class SmtpEmailProvider extends BaseProvider<EmailPayload, EmailPayload & { Subject: string; Html: string; Text: string }> {
  protected templates = EmailTemplates;
  private transporter: any;

  constructor() {
    super()
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(payload: EmailPayload): Promise<void> { 

    const rendered = this.render(payload);
    await this.transporter.sendMail({
      from: `"GymApp" <${process.env.APP_EMAIL}>`,
      to: rendered.to,
      subject: rendered.subject,
      html: rendered.html,
    });
  }
}
