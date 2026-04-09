import { CardMovedEvent } from "./events.types";

export function isCardMovedEvent(
  payload: unknown
): payload is CardMovedEvent {
  if (typeof payload !== "object" || payload === null) return false;

  const p = payload as Record<string, unknown>;

  return (
    typeof p.cardId === "string" &&
    typeof p.targetColumnId === "string" &&
    typeof p.targetPosition === "number"
  );
}
