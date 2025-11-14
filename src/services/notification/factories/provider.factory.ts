import { ConsoleProvider } from "../providers/console.provider";
import { SmtpEmailProvider } from "../providers/smtp.email.provider";
import { TwilioSmsProvider } from "../providers/twilio.sms.provider";
import { TwilioWhatsappProvider } from "../providers/twilio.whatsapp.provider";

export class ProviderFactory {
  static createEmailProvider() {
    if (process.env.NODE_ENV === "production") return new SmtpEmailProvider();
    return new ConsoleProvider();
  }

  static createSmsProvider() {
    if (process.env.NODE_ENV === "production") return new TwilioSmsProvider();
    return new ConsoleProvider();
  }

  static createWhatsappProvider() {
    if (process.env.NODE_ENV === "production") return new TwilioWhatsappProvider();
    return new ConsoleProvider();
  }
}
