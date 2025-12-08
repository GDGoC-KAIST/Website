import cors, {CorsOptionsDelegate} from "cors";

const allowlist = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowLocalhost = process.env.CORS_ALLOW_LOCALHOST === "true";

const isLocalhost = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

function originAllowed(origin: string | undefined | null): boolean {
  if (!origin) return true; // allow server-to-server tools

  const inAllowlist = allowlist.includes(origin);
  const localhostOk = allowLocalhost && isLocalhost(origin);

  if (process.env.NODE_ENV === "production") {
    return inAllowlist;
  }

  if (localhostOk) return true;
  return inAllowlist;
}

const corsOptionsDelegate: CorsOptionsDelegate = (req, callback) => {
  const origin = (req.headers?.origin as string | undefined) || undefined;
  const allowed = originAllowed(origin);

  const options = {
    origin: allowed ? origin || true : false,
    credentials: true,
  };

  callback(null, options);
};

export const corsMiddleware = cors(corsOptionsDelegate);
