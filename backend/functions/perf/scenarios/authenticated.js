import {check, sleep, fail} from "k6";
import {config} from "../lib/env.js";
import {get, patch} from "../lib/http.js";

if (!config.userToken) {
  fail("USER_TOKEN is required for authenticated scenario (set __ENV.USER_TOKEN)");
}

export const options = {
  stages: [
    {duration: "30s", target: 5},
    {duration: "2m", target: 15},
    {duration: "2m", target: 15},
  ],
};

function maybePatchProfile() {
  if (Math.random() > 0.1) return;
  const payload = {
    department: `perf-${__VU || 0}`,
  };
  const res = patch("/v2/users/me", payload, {token: config.userToken});
  check(res, {"patch me 200": (r) => r.status === 200});
}

export default function authenticatedScenario() {
  const me = get("/v2/users/me", {token: config.userToken});
  check(me, {"me is 200": (r) => r.status === 200});

  const images = get("/v2/images", {token: config.userToken});
  check(images, {"images with auth 200": (r) => r.status === 200});

  maybePatchProfile();

  sleep(1);
}
