"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailChannel = void 0;
class EmailChannel {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async send(payload) {
        await this.provider.send(payload);
    }
}
exports.EmailChannel = EmailChannel;
