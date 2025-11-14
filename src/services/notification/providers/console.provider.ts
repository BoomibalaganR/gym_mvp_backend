import { BaseProvider } from "./base.provider";

export class ConsoleProvider<T = any, R = T> extends BaseProvider<T, R> {
  protected templates: Record<string, any> = {};

  async send(payload: R): Promise<void> {
    console.log("🧩 [DEV MODE] Simulated send:\n", JSON.stringify(payload, null, 2));
  }
}
