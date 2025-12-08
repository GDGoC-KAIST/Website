import {check} from "k6";
import {post} from "../lib/http.js";
import {RecruitLoginFailCounter} from "../lib/metrics.js";

export const options = {
  scenarios: {
    recruit_attack: {
      executor: "constant-arrival-rate",
      rate: 20,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 1,
      maxVUs: 5,
    },
  },
};

export default function recruitAttackScenario() {
  const payload = {
    kaistEmail: `bot-${__VU || 0}@example.com`,
    password: "invalid-password",
  };

  const res = post("/v2/recruit/login", payload, {expect429: true});
  if (res.status === 401 || res.status === 423) {
    RecruitLoginFailCounter.add(1);
  }

  check(res, {
    "expected auth/lock/limit response": (r) => [200, 400, 401, 423, 429].includes(r.status),
  });
}
