export function appendTaskLog(
  existingLogs: string[],
  message: string
): string[] {
  const timestamp = new Date().toISOString();
  return [...existingLogs, `[${timestamp}] ${message}`];
}
