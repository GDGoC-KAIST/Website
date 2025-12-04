export function normalizeUrl(raw?: string): string {
  if (!raw) return "";

  let url = String(raw).trim();

  url = url.replace(/^https?:\/\/https?:\/\//i, (match) => {
    const protocol = match.toLowerCase().startsWith("https") ? "https" : "http";
    return `${protocol}://`;
  });

  url = url.replace(/^https?:\/\/https?:\/\/?/i, (match) =>
    match.toLowerCase().startsWith("https") ? "https://" : "http://"
  );

  url = url.replace(/^https?:\/\/http\/\//i, (match) =>
    match.toLowerCase().startsWith("https") ? "https://" : "http://"
  );

  url = url.replace(/^https?\/\/\/?/i, (match) =>
    match.toLowerCase().startsWith("https") ? "https://" : "http://"
  );

  if (url.startsWith("//")) {
    url = `http:${url}`;
  }

  url = url.replace(/ /g, "%20");

  return url;
}
