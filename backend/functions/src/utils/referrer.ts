export function getReferrerHost(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.host || undefined;
  } catch {
    return undefined;
  }
}
