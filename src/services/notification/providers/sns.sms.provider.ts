import {
    PublishCommand,
    SNSClient,
} from "@aws-sdk/client-sns";

import { SmsPayload } from "../interfaces/payload.interface";
import { SmsTemplates } from "../templates/sms.template";
import { BaseProvider } from "./base.provider";

export class AwsSnsSmsProvider extends BaseProvider<
  SmsPayload,
  SmsPayload & { message: string }
> {
  protected templates = SmsTemplates;
  private client: SNSClient;

  constructor() {
    super();

    this.client = new SNSClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async send(payload: SmsPayload): Promise<void> {
    const rendered = this.render(payload);

    const command = new PublishCommand({
      Message: rendered.message,
      PhoneNumber: rendered.to,
    });

    await this.client.send(command); 
    console.log(`SMS sent to ${rendered.to} via AWS SNS`);
  }
}
