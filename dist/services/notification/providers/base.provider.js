"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
class BaseProvider {
    render(payload) {
        const template = this.templates[payload.templateName];
        if (!template)
            throw new Error(`Template ${payload.templateName} not found`);
        if (typeof template === "object") {
            const rendered = Object.fromEntries(Object.entries(template).map(([key, val]) => [
                key,
                val.replace(/{(\w+)}/g, (_, k) => payload.context[k] || ""),
            ]));
            return { ...payload, ...rendered };
        }
        return { ...payload, message: template.replace(/{(\w+)}/g, (_, k) => payload.context[k] || "") };
    }
}
exports.BaseProvider = BaseProvider;
