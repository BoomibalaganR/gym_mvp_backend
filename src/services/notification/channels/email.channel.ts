import { Channel } from "../interfaces/channel.interface";
import { EmailPayload } from "../interfaces/payload.interface";
import { Provider } from "../interfaces/provider.interface";

export class EmailChannel implements Channel<EmailPayload> {
  constructor(private provider: Provider<EmailPayload>) {}

  async send(payload: EmailPayload): Promise<void> {
    await this.provider.send(payload);
  }
}
