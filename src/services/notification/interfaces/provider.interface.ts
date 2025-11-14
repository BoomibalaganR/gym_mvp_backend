export interface Provider<T, R = T> {
  render(payload: T): R;
  send(payload: R): Promise<void>;
}
