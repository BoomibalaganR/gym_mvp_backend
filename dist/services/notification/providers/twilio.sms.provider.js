"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioSmsProvider = void 0;
const base_provider_1 = require("./base.provider");
const sms_template_1 = require("../templates/sms.template");
const env_1 = require("../../../config/env");
const twilio_1 = __importDefault(require("twilio"));
class TwilioSmsProvider extends base_provider_1.BaseProvider {
    templates = sms_template_1.SmsTemplates;
    client;
    constructor() {
        super();
        this.client = (0, twilio_1.default)(env_1.config.twilioAccountSid, env_1.config.twilioAuthToken);
    }
    async send(payload) {
        const rendered = this.render(payload);
        await this.client.messages.create({
            from: env_1.config.twilioPhoneNumber,
            to: rendered.to,
            body: rendered.message,
        });
        console.log(`SMS sent to ${rendered.to}`);
    }
}
exports.TwilioSmsProvider = TwilioSmsProvider;
