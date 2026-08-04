type LogDetails = Record<string, unknown> | undefined;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export const serverLogger = {
  info(event: string, details?: LogDetails) {
    console.info(`[Servers] ${event}`, details ?? "");
  },
  warn(event: string, details?: LogDetails) {
    console.warn(`[Servers] ${event}`, details ?? "");
  },
  error(event: string, error: unknown, details?: LogDetails) {
    console.error(`[Servers] ${event}: ${errorMessage(error)}`, details ?? "");
    if (error instanceof Error && error.stack) console.error(error.stack);
  },
};
