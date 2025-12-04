import {normalizeList} from "./normalize";
import {Member, Project, Seminar, ImageDoc, User} from "./types";

const BASE_URL_RAW = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = BASE_URL_RAW ? BASE_URL_RAW.replace(/\/+$/, "") : undefined;

if (!BASE_URL) {
  throw new Error("🚨 NEXT_PUBLIC_API_BASE_URL is missing");
}

function buildQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${path}`;
  console.log("[fetchAPI]", options.method ?? "GET", url);

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers,
    ...options,
  });

  if (!res.ok) {
    let msg = `API Error: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error?.message || data?.message || msg;
    } catch {
      // ignore response parsing errors
    }
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

async function postAPI<T>(endpoint: string, body: unknown): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
}

async function putAPI<T>(endpoint: string, body: unknown): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
}

async function deleteAPI<T>(endpoint: string, body?: unknown): Promise<T> {
  return fetchAPI<T>(endpoint, {
    method: "DELETE",
    headers: body ? {"Content-Type": "application/json"} : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function uploadAPI<T>(endpoint: string, formData: FormData): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${path}`;
  console.log("[uploadAPI]", url);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let msg = `API Error: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error?.message || data?.message || msg;
    } catch {
      // ignore response parsing errors
    }
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  // Seminars
  getSeminars: async (params?: {semester?: string; type?: string; limit?: number}) => {
    const qs = buildQueryString(params);
    const res = await fetchAPI<unknown>(`/getSeminars${qs}`);
    return normalizeList<Seminar>(res);
  },
  getSeminar: (id: string) => fetchAPI<Seminar>(`/getSeminar/${id}`),
  updateSeminar: (id: string, body: Record<string, unknown>) =>
    putAPI(`/updateSeminar/${id}`, body),
  deleteSeminar: (id: string, body: {adminId: string}) =>
    deleteAPI(`/deleteSeminar/${id}`, body),

  // Projects
  getProjects: async (params?: {semester?: string; status?: string; limit?: number}) => {
    const qs = buildQueryString(params);
    const res = await fetchAPI<unknown>(`/getProjects${qs}`);
    return normalizeList<Project>(res);
  },
  getProject: (id: string) => fetchAPI<Project>(`/getProject/${id}`),
  updateProject: (id: string, body: Record<string, unknown>) =>
    putAPI(`/updateProject/${id}`, body),
  deleteProject: (id: string, body: {adminId: string}) =>
    deleteAPI(`/deleteProject/${id}`, body),

  // Members
  getMembers: async (params?: {limit?: number}) => {
    const qs = buildQueryString(params);
    const res = await fetchAPI<unknown>(`/getMembers${qs}`);
    return normalizeList<Member>(res);
  },
  createMember: (body: Record<string, unknown>) => postAPI("/createMember", body),
  updateMember: (id: string, body: Record<string, unknown>) =>
    putAPI(`/updateMember/${id}`, body),
  deleteMember: (id: string) => deleteAPI(`/deleteMember/${id}`),

  // Images
  getImage: (id: string) => fetchAPI<ImageDoc>(`/getImage/${id}`),
  getImages: async (params?: {limit?: number; offset?: number}) => {
    const qs = buildQueryString(params);
    const res = await fetchAPI<unknown>(`/getImages${qs}`);
    return normalizeList<ImageDoc>(res);
  },
  createImage: (formData: FormData) => uploadAPI<ImageDoc>("/createImage", formData),
  deleteImage: (id: string) => deleteAPI(`/deleteImage/${id}`),

  // Mutations
  createSeminar: (body: Record<string, unknown>) => postAPI("/createSeminar", body),
  createProject: (body: Record<string, unknown>) => postAPI("/createProject", body),

  // Approvals
  getPendingUsers: async (adminId: string) => {
    const qs = buildQueryString({adminId});
    const res = await fetchAPI<unknown>(`/getPendingUsers${qs}`);
    return normalizeList<User>(res);
  },
  approveUser: (userId: string, adminId: string) =>
    postAPI("/approveUser", {userId, adminId}),
  rejectUser: (userId: string, adminId: string) =>
    postAPI("/rejectUser", {userId, adminId}),
};
