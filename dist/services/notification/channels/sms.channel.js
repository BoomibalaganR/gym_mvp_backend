"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsChannel = void 0;
class SmsChannel {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async send(payload) {
        await this.provider.send(payload);
    }
}
exports.SmsChannel = SmsChannel;
