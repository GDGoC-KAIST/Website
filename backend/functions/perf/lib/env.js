import {fail} from "k6";

const baseUrl = (__ENV.BASE_URL || "").trim();
const userToken = (__ENV.USER_TOKEN || "").trim();
const adminToken = (__ENV.ADMIN_TOKEN || "").trim();

if (!baseUrl) {
  fail("BASE_URL is required (set __ENV.BASE_URL)");
}

export const config = {
  baseUrl,
  userToken,
  adminToken,
};
