import { BaseProvider } from "./base.provider";
import { Provider } from "../interfaces/provider.interface";
import { WhatsappPayload } from "../interfaces/payload.interface";
import { WhatsappTemplates } from "../templates/whatsapp.template";
import twilio from "twilio";

export class TwilioWhatsappProvider extends BaseProvider<WhatsappPayload, WhatsappPayload & { message: string }> {
  protected templates = WhatsappTemplates;
  private client: any;

  constructor() { 
    super()
    this.client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  }

  async send(payload: WhatsappPayload): Promise<void> { 
    
    const rendered = this.render(payload);
    await this.client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${rendered.to}`,
      body: rendered.message,
    });
  }
}
