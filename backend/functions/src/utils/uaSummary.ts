import type {UASummary} from "../types/telemetry";

export function summarizeUa(uaRaw?: string): UASummary {
  const ua = uaRaw || "";
  const isBot = /bot|crawler|spider|crawl/i.test(ua);

  let browser = "Unknown";
  if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edge/i.test(ua)) browser = "Edge";

  let os = "Unknown";
  if (/Mac OS X|Macintosh/i.test(ua)) os = "Mac";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";

  return {browser, os, device, isBot};
}
