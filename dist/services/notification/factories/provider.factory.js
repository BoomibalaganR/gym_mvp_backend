"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
const console_provider_1 = require("../providers/console.provider");
const twilio_whatsapp_provider_1 = require("../providers/twilio.whatsapp.provider");
class ProviderFactory {
    static createEmailProvider() {
        if (process.env.NODE_ENV === "production")
            return new console_provider_1.ConsoleProvider();
        return new console_provider_1.ConsoleProvider();
    }
    static createSmsProvider() {
        if (process.env.NODE_ENV === "production")
            return new console_provider_1.ConsoleProvider();
        return new console_provider_1.ConsoleProvider();
    }
    static createWhatsappProvider() {
        if (process.env.NODE_ENV === "production")
            return new twilio_whatsapp_provider_1.TwilioWhatsappProvider();
        return new console_provider_1.ConsoleProvider();
    }
}
exports.ProviderFactory = ProviderFactory;
