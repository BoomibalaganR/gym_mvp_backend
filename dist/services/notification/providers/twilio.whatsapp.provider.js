"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioWhatsappProvider = void 0;
const base_provider_1 = require("./base.provider");
const whatsapp_template_1 = require("../templates/whatsapp.template");
const twilio_1 = __importDefault(require("twilio"));
class TwilioWhatsappProvider extends base_provider_1.BaseProvider {
    templates = whatsapp_template_1.WhatsappTemplates;
    client;
    constructor() {
        super();
        this.client = (0, twilio_1.default)(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    }
    async send(payload) {
        const rendered = this.render(payload);
        await this.client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${rendered.to}`,
            body: rendered.message,
        });
    }
}
exports.TwilioWhatsappProvider = TwilioWhatsappProvider;
