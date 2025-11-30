"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpEmailProvider = void 0;
const base_provider_1 = require("./base.provider");
const email_template_1 = require("../templates/email.template");
const nodemailer_1 = __importDefault(require("nodemailer"));
class SmtpEmailProvider extends base_provider_1.BaseProvider {
    templates = email_template_1.EmailTemplates;
    transporter;
    constructor() {
        super();
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async send(payload) {
        const rendered = this.render(payload);
        await this.transporter.sendMail({
            from: `"GymApp" <${process.env.APP_EMAIL}>`,
            to: rendered.to,
            subject: rendered.subject,
            html: rendered.html,
        });
    }
}
exports.SmtpEmailProvider = SmtpEmailProvider;
