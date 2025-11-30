"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSnsSmsProvider = void 0;
const client_sns_1 = require("@aws-sdk/client-sns");
const base_provider_1 = require("./base.provider");
const sms_template_1 = require("../templates/sms.template");
class AwsSnsSmsProvider extends base_provider_1.BaseProvider {
    templates = sms_template_1.SmsTemplates;
    client;
    constructor() {
        super();
        this.client = new client_sns_1.SNSClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async send(payload) {
        const rendered = this.render(payload);
        const command = new client_sns_1.PublishCommand({
            Message: rendered.message,
            PhoneNumber: rendered.to,
        });
        await this.client.send(command);
        console.log(`SMS sent to ${rendered.to} via AWS SNS`);
    }
}
exports.AwsSnsSmsProvider = AwsSnsSmsProvider;
