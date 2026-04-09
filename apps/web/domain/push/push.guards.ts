import { PushKeys } from "./push.types";

export function isPushKeys(value: unknown): value is PushKeys {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  return (
    typeof v.p256dh === "string" &&
    typeof v.auth === "string"
  );
}
