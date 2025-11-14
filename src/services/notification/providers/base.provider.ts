import { Provider } from "../interfaces/provider.interface";

export abstract class BaseProvider<T, R = T> implements Provider<T, R> {
  protected abstract templates: Record<string, any>;

  render(payload: T): R {
    const template = this.templates[(payload as any).templateName];
    if (!template) throw new Error(`Template ${(payload as any).templateName} not found`);

    if (typeof template === "object") {
      const rendered = Object.fromEntries(
        Object.entries(template).map(([key, val]) => [
          key,
          val.replace(/{(\w+)}/g, (_, k) => (payload as any).context[k] || ""),
        ])
      );
      return { ...payload, ...rendered } as any;
    }

    return { ...payload, message: template.replace(/{(\w+)}/g, (_, k) => (payload as any).context[k] || "")} as any;
  }

  abstract send(payload: R): Promise<void>;
}
