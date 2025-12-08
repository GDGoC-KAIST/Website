import {check, sleep} from "k6";
import {config} from "../lib/env.js";
import {get} from "../lib/http.js";

export const options = {
  stages: [
    {duration: "30s", target: 5},
    {duration: "2m", target: 20},
    {duration: "2m", target: 20},
  ],
};

function pickImageId(listResponse) {
  try {
    const body = listResponse.json();
    const items = Array.isArray(body)
      ? body
      : Array.isArray(body?.images)
        ? body.images
        : Array.isArray(body?.data)
          ? body.data
          : [];
    if (!items.length) return null;
    const pick = items[Math.floor(Math.random() * items.length)];
    if (typeof pick === "string") return pick;
    return pick?.id || pick?.imageId || null;
  } catch (_err) {
    return null;
  }
}

export default function browseScenario() {
  const health = get("/v2/healthz");
  check(health, {"healthz is 200": (r) => r.status === 200});

  const list = get("/v2/images");
  check(list, {"images list is 200": (r) => r.status === 200});

  const imageId = list.status === 200 ? pickImageId(list) : null;
  if (imageId) {
    const detail = get(`/v2/images/${imageId}`);
    check(detail, {"image detail ok": (r) => r.status === 200});
  }

  sleep(1);
}
