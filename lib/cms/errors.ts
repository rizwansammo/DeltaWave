// Distinguishes "the database cannot be reached" from every other failure.
// Only the former may fall back to approved content; access-control,
// validation and programming errors must surface.

const unreachableCodes = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  // PostgreSQL connection exceptions and server shutdown.
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "57P01",
  "57P02",
  "57P03",
  "53300",
]);

const unreachableMessages = [
  /cannot connect to postgres/i,
  /connection terminated/i,
  /terminating connection/i,
  /timeout exceeded when trying to connect/i,
  /the database system is (starting up|shutting down)/i,
];

export function isDatabaseUnavailable(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 6; depth++) {
    if (typeof current !== "object") break;
    const e = current as { code?: unknown; message?: unknown; cause?: unknown; errors?: unknown };
    if (typeof e.code === "string" && unreachableCodes.has(e.code)) return true;
    if (typeof e.message === "string" && unreachableMessages.some((m) => m.test(e.message as string)))
      return true;
    // Node reports a refused dual-stack connection as an AggregateError.
    if (Array.isArray(e.errors) && e.errors.some((inner) => isDatabaseUnavailable(inner))) return true;
    current = e.cause;
  }
  return false;
}
