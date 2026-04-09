export const idempotencyKeys = {
  request: (key: string) => `idempotency:req:${key}`,
  lock: (key: string) => `idempotency:lock:${key}`,
};
