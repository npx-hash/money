export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = "code" in error ? (error as { code?: unknown }).code : undefined;
  if (maybeCode === "P1000" || maybeCode === "P1001") {
    return true;
  }

  if (!("message" in error)) {
    return false;
  }

  const message = String((error as { message?: unknown }).message ?? "");
  return /can't reach database server|econnrefused|connection/i.test(message);
}
