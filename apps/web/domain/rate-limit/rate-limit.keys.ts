export const rateLimitKeys = {
  user: (userId: string, window: string) =>
    `rate:user:${userId}:${window}`,
};
