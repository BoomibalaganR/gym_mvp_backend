import { EmailChannel } from "./channels/email.channel";
import { NotificationPayload } from "./interfaces/payload.interface";
import { ProviderFactory } from "./factories/provider.factory";
import { SmsChannel } from "./channels/sms.channel";
import { WhatsappChannel } from "./channels/whatsapp.channel";

export class NotificationService {
  private channels: Record<string, any> = {};

  constructor() {
    this.channels = {
      email: new EmailChannel(ProviderFactory.createEmailProvider()),
      sms: new SmsChannel(ProviderFactory.createSmsProvider()),
      whatsapp: new WhatsappChannel(ProviderFactory.createWhatsappProvider()),
    };
  }

  async send(payloads: NotificationPayload): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (payloads.email) tasks.push(this.channels.email.send(payloads.email.payload));
    if (payloads.sms) tasks.push(this.channels.sms.send(payloads.sms.payload));
    if (payloads.whatsapp) tasks.push(this.channels.whatsapp.send(payloads.whatsapp.payload));

    await Promise.all(tasks);
  }
}
