"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleProvider = void 0;
const base_provider_1 = require("./base.provider");
class ConsoleProvider extends base_provider_1.BaseProvider {
    templates = {};
    async send(payload) {
        console.log("🧩 [DEV MODE] Simulated send:\n", JSON.stringify(payload, null, 2));
    }
}
exports.ConsoleProvider = ConsoleProvider;
