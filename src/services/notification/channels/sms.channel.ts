import { Channel } from "../interfaces/channel.interface";
import { SmsPayload } from "../interfaces/payload.interface";
import { Provider } from "../interfaces/provider.interface";

export class SmsChannel implements Channel<SmsPayload> {
  constructor(private provider: Provider<SmsPayload>) {}

  async send(payload: SmsPayload): Promise<void> {
    await this.provider.send(payload);
  }
}
