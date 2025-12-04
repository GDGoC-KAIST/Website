const BASE_URL_RAW = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = BASE_URL_RAW ? BASE_URL_RAW.replace(/\/+$/, "") : undefined;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
}

const jsonHeaders = {"Content-Type": "application/json"};

export type RecruitStatus = "submitted" | "reviewing" | "accepted" | "rejected" | "hold";

export interface RecruitConfig {
  isOpen: boolean;
  openAt: string;
  closeAt: string;
  messageWhenClosed: string;
  semester?: string;
}

export interface RecruitApplication {
  id: string;
  name: string;
  kaistEmail: string;
  googleEmail: string;
  phone: string;
  department: string;
  studentId: string;
  motivation: string;
  experience: string;
  wantsToDo: string;
  githubUsername?: string;
  portfolioUrl?: string;
  status: RecruitStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type RecruitApplyInput = {
  name: string;
  kaistEmail: string;
  googleEmail: string;
  phone: string;
  department: string;
  studentId: string;
  motivation: string;
  experience: string;
  wantsToDo: string;
  githubUsername?: string;
  portfolioUrl?: string;
  password: string;
};

export type RecruitUpdateInput = Omit<
  RecruitApplyInput,
  "kaistEmail" | "password"
> & {kaistEmail?: string};

class RecruitApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers,
  });

  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    const message = payload?.error || payload?.message || `Recruit API error (${res.status})`;
    throw new RecruitApiError(message, res.status, payload);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export async function getRecruitConfig(): Promise<RecruitConfig> {
  return request<RecruitConfig>("/recruitConfig");
}

export async function applyRecruit(data: RecruitApplyInput): Promise<{success: boolean}> {
  return request("/recruitApply", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data),
  });
}

export interface RecruitLoginResult {
  success: boolean;
  token?: string;
  lockedUntil?: string;
}

export async function loginRecruit(credentials: {
  kaistEmail: string;
  password: string;
}): Promise<RecruitLoginResult> {
  try {
    const result = await request<{success: boolean; token: string}>("/recruitLogin", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(credentials),
    });
    return {success: result.success, token: result.token};
  } catch (error) {
    if (error instanceof RecruitApiError && error.status === 423) {
      return {
        success: false,
        lockedUntil: error.data?.lockedUntil || error.data?.message,
      };
    }
    throw error;
  }
}

export async function getMyApplication(token: string): Promise<RecruitApplication> {
  return request<RecruitApplication>("/recruitMe", {
    headers: {Authorization: `Bearer ${token}`},
  });
}

export async function updateRecruit(
  token: string,
  data: RecruitUpdateInput
): Promise<{success: boolean}> {
  return request("/recruitUpdate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function resetPasswordRequest(kaistEmail: string): Promise<{success: boolean}> {
  return request("/recruitReset", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({kaistEmail}),
  });
}

export async function resetPasswordConfirm(
  token: string,
  newPassword: string
): Promise<{success: boolean}> {
  return request("/recruitResetConfirm", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({token, password: newPassword}),
  });
}

export interface AdminApplicationsResponse {
  applications: RecruitApplication[];
  total: number;
}

export async function getAdminApplications(
  adminId: string,
  params?: {status?: RecruitStatus | "all"; limit?: number; offset?: number}
): Promise<AdminApplicationsResponse> {
  const query = buildQuery({
    adminId,
    limit: params?.limit,
    offset: params?.offset,
    status: params?.status && params.status !== "all" ? params.status : undefined,
  });
  return request(`/adminGetApplications${query}`);
}

export async function updateApplicationStatus(
  adminId: string,
  id: string,
  status: RecruitStatus,
  options?: {notify?: boolean; email?: {subject: string; html: string}}
): Promise<{success: boolean; emailSent?: boolean; warning?: string}> {
  return request("/adminUpdateApplicationStatus", {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify({adminId, id, status, notify: options?.notify, email: options?.email}),
  });
}

export async function getAdminRecruitConfig(adminId: string): Promise<RecruitConfig> {
  const query = buildQuery({adminId});
  return request(`/adminGetRecruitConfig${query}`);
}

export async function updateAdminRecruitConfig(
  adminId: string,
  config: Partial<RecruitConfig>
): Promise<{success: boolean}> {
  return request("/adminUpdateRecruitConfig", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({adminId, ...config}),
  });
}

export function getExportUrl(adminId: string, status?: RecruitStatus | "all"): string {
  const params: Record<string, string> = {adminId};
  if (status && status !== "all") {
    params.status = status;
  }
  const query = buildQuery(params);
  return `${BASE_URL}/adminExportApplications${query}`;
}

export {RecruitApiError};
