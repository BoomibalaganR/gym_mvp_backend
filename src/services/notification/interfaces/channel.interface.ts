export interface Channel<T> {
  send(payload: T): Promise<void>;
}
