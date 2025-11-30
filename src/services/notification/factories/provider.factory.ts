import { ConsoleProvider } from "../providers/console.provider";
import { TwilioWhatsappProvider } from "../providers/twilio.whatsapp.provider";

export class ProviderFactory {
  static createEmailProvider() {
    if (process.env.NODE_ENV === "production") return new ConsoleProvider();
    return new ConsoleProvider();
  }

  static createSmsProvider() {
    if (process.env.NODE_ENV === "production") return new ConsoleProvider();
    return new ConsoleProvider();
  }

  static createWhatsappProvider() {
    if (process.env.NODE_ENV === "production") return new TwilioWhatsappProvider();
    return new ConsoleProvider();
  }
}
