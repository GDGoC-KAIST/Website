import {normalizeList} from "./normalize";
import {Member, Project, Seminar, ImageDoc} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) console.error("🚨 NEXT_PUBLIC_API_BASE_URL is missing");

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
  }
  
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${path}`;
  
  try {
    const res = await fetch(url, {
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
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`API 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요. (${url})`);
    }
    throw error;
  }
}

export const api = {
  // Seminars
  getSeminars: async (params?: {semester?: string; type?: string; limit?: number; offset?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<any>(`/getSeminars?${qs}`);
    return normalizeList<Seminar>(res);
  },
  getSeminar: (id: string) => fetchAPI<Seminar>(`/getSeminar/${id}`),
  createSeminar: async (data: any) => {
    return fetchAPI<Seminar>("/createSeminar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateSeminar: async (id: string, data: any) => {
    return fetchAPI<Seminar>(`/updateSeminar/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteSeminar: async (id: string, userId: string) => {
    return fetchAPI<{message: string; id: string}>(`/deleteSeminar/${id}`, {
      method: "DELETE",
      body: JSON.stringify({userId}),
    });
  },

  // Projects
  getProjects: async (params?: {semester?: string; status?: string; limit?: number; offset?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<any>(`/getProjects?${qs}`);
    return normalizeList<Project>(res);
  },
  getProject: (id: string) => fetchAPI<Project>(`/getProject/${id}`),
  createProject: async (data: any) => {
    return fetchAPI<Project>("/createProject", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateProject: async (id: string, data: any) => {
    return fetchAPI<Project>(`/updateProject/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteProject: async (id: string, userId: string) => {
    return fetchAPI<{message: string; id: string}>(`/deleteProject/${id}`, {
      method: "DELETE",
      body: JSON.stringify({userId}),
    });
  },

  // Members
  getMembers: async (params?: {limit?: number; offset?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<any>(`/getMembers?${qs}`);
    return normalizeList<Member>(res);
  },

  // Images
  getImage: (id: string) => fetchAPI<ImageDoc>(`/getImage/${id}`),

  // Users
  getApprovedUsers: async (params?: {limit?: number; offset?: number}) => {
    const qs = new URLSearchParams(params as any).toString();
    const res = await fetchAPI<{users: any[]; total: number}>(`/getApprovedUsers?${qs}`);
    return res;
  },
};
