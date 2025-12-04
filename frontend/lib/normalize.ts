export function normalizeList<T>(response: unknown): {data: T[]; total: number} {
  const data = response as Record<string, unknown> | T[] | null | undefined;
  if (!response) return {data: [], total: 0};
  if (Array.isArray(data)) return {data: data as T[], total: data.length};

  if (data && Array.isArray((data as Record<string, unknown>).data)) {
    const list = (data as {data: T[]; total?: number}).data;
    return {data: list, total: Number((data as any).total ?? list.length)};
  }

  if (data && Array.isArray((data as Record<string, unknown>).seminars)) {
    const list = (data as {seminars: T[]; total?: number}).seminars;
    return {data: list, total: Number((data as any).total ?? list.length)};
  }
  if (data && Array.isArray((data as Record<string, unknown>).projects)) {
    const list = (data as {projects: T[]; total?: number}).projects;
    return {data: list, total: Number((data as any).total ?? list.length)};
  }
  if (data && Array.isArray((data as Record<string, unknown>).members)) {
    const list = (data as {members: T[]; total?: number}).members;
    return {data: list, total: Number((data as any).total ?? list.length)};
  }
  if (data && Array.isArray((data as Record<string, unknown>).images)) {
    const list = (data as {images: T[]; total?: number}).images;
    return {data: list, total: Number((data as any).total ?? list.length)};
  }

  console.warn("normalizeList: Unknown response format", response);
  return {data: [], total: 0};
}
