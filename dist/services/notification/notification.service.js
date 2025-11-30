"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const email_channel_1 = require("./channels/email.channel");
const provider_factory_1 = require("./factories/provider.factory");
const sms_channel_1 = require("./channels/sms.channel");
const whatsapp_channel_1 = require("./channels/whatsapp.channel");
class NotificationService {
    channels = {};
    constructor() {
        this.channels = {
            email: new email_channel_1.EmailChannel(provider_factory_1.ProviderFactory.createEmailProvider()),
            sms: new sms_channel_1.SmsChannel(provider_factory_1.ProviderFactory.createSmsProvider()),
            whatsapp: new whatsapp_channel_1.WhatsappChannel(provider_factory_1.ProviderFactory.createWhatsappProvider()),
        };
    }
    async send(payloads) {
        const tasks = [];
        if (payloads.email)
            tasks.push(this.channels.email.send(payloads.email.payload));
        if (payloads.sms)
            tasks.push(this.channels.sms.send(payloads.sms.payload));
        if (payloads.whatsapp)
            tasks.push(this.channels.whatsapp.send(payloads.whatsapp.payload));
        await Promise.all(tasks);
    }
}
exports.NotificationService = NotificationService;
