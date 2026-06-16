export class ViewerUnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
  }
}

export async function viewerFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event("vs:user-unauthorized"));
    throw new ViewerUnauthorizedError();
  }
  return res;
}

export async function viewerJSON<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await viewerFetch(path, { ...init, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
