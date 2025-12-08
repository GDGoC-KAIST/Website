import type {UtmParams} from "../types/telemetry";

export function getUtm(query: Record<string, unknown> | undefined): UtmParams | undefined {
  if (!query) return undefined;
  const params: UtmParams = {};
  const setIfString = (key: keyof UtmParams, value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      params[key] = value.trim();
    }
  };

  setIfString("source", query.utm_source);
  setIfString("medium", query.utm_medium);
  setIfString("campaign", query.utm_campaign);

  return Object.keys(params).length ? params : undefined;
}
