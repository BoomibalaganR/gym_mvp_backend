import { BaseProvider } from "./base.provider";
import { SmsPayload } from "../interfaces/payload.interface";
import { SmsTemplates } from "../templates/sms.template";
import { config } from "../../../config/env";
import twilio from "twilio";

export class TwilioSmsProvider extends BaseProvider<SmsPayload, SmsPayload & { message: string }> {
  protected templates = SmsTemplates;
  private client: any;

  constructor() {
    super()
    this.client = twilio(config.twilioAccountSid, config.twilioAuthToken);
  }

  async send(payload: SmsPayload): Promise<void> {

    const rendered = this.render(payload);
    await this.client.messages.create({
      from: config.twilioPhoneNumber,
      to: rendered.to,
      body: rendered.message,
    }); 
    console.log(`SMS sent to ${rendered.to}`);
  }
}
