import { Channel } from "../interfaces/channel.interface";
import { Provider } from "../interfaces/provider.interface";
import { WhatsappPayload } from "../interfaces/payload.interface";

export class WhatsappChannel implements Channel<WhatsappPayload> {
  constructor(private provider: Provider<WhatsappPayload>) {}

  async send(payload: WhatsappPayload): Promise<void> {
    await this.provider.send(payload);
  }
}
