import { BaseProvider } from "./base.provider";
import { SmsPayload } from "../interfaces/payload.interface";
import { SmsTemplates } from "../templates/sms.template";
import twilio from "twilio";

export class TwilioSmsProvider extends BaseProvider<SmsPayload, SmsPayload & { message: string }> {
  protected templates = SmsTemplates;
  private client: any;

  constructor() {
    super()
    this.client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  }

  async send(payload: SmsPayload): Promise<void> {

    const rendered = this.render(payload);
    await this.client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: rendered.to,
      body: rendered.message,
    });
  }
}
