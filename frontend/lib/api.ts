import {normalizeList} from "./normalize";
import {Member, Project, Seminar, ImageDoc} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) console.error("🚨 NEXT_PUBLIC_API_BASE_URL is missing");

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store", // Default to no-cache for Server Components (Realtime)
    headers: {"Content-Type": "application/json", ...options.headers},
    ...options,
  });

  if (!res.ok) {
    let msg = `API Error: ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error?.message || data?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  // Seminars
  getSeminars: async (params?: {semester?: string; type?: string; limit?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<any>(`/getSeminars?${qs}`);
    return normalizeList<Seminar>(res);
  },
  getSeminar: (id: string) => fetchAPI<Seminar>(`/getSeminar/${id}`),

  // Projects
  getProjects: async (params?: {semester?: string; status?: string; limit?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<any>(`/getProjects?${qs}`);
    return normalizeList<Project>(res);
  },
  getProject: (id: string) => fetchAPI<Project>(`/getProject/${id}`),

  // Members
  getMembers: async (params?: {limit?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<any>(`/getMembers?${qs}`);
    return normalizeList<Member>(res);
  },

  // Images
  getImage: (id: string) => fetchAPI<ImageDoc>(`/getImage/${id}`),
};
