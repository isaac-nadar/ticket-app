export function isWebPushGoneError(
  err: unknown
): err is { statusCode: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === 410
  );
}

export function isWebPushNotFoundError(
  err: unknown
): err is { statusCode: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === 404
  );
}
