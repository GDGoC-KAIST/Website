export function normalizeList<T>(response: any): { data: T[] } {
  if (!response) return { data: [] };
  if (Array.isArray(response)) return { data: response };
  
  if (response.data && Array.isArray(response.data)) return { data: response.data };
  
  // Legacy/Fallback field names
  if (response.seminars && Array.isArray(response.seminars)) return { data: response.seminars };
  if (response.projects && Array.isArray(response.projects)) return { data: response.projects };
  if (response.members && Array.isArray(response.members)) return { data: response.members };
  
  console.warn("normalizeList: Unknown response format", response);
  return { data: [] };
}
