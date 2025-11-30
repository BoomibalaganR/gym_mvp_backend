"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappChannel = void 0;
class WhatsappChannel {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async send(payload) {
        await this.provider.send(payload);
    }
}
exports.WhatsappChannel = WhatsappChannel;
