import browseScenario from "./browse.js";
import authenticatedScenario from "./authenticated.js";

const steadyDuration = (__ENV.SOAK_DURATION || "30m").trim();

export const options = {
  scenarios: {
    soak_browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        {duration: "1m", target: 10},
        {duration: steadyDuration, target: 10},
      ],
      exec: "browseExec",
    },
    soak_auth: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        {duration: "1m", target: 5},
        {duration: steadyDuration, target: 5},
      ],
      exec: "authExec",
    },
  },
};

export function browseExec() {
  browseScenario();
}

export function authExec() {
  authenticatedScenario();
}
