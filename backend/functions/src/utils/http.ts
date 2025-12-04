export async function safeFetch(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {...options, signal: controller.signal});
    return response;
  } catch (error) {
    if ((error as DOMException).name === "AbortError") {
      throw new Error("UPSTREAM_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
