const BASE = "/api/auth";

export type ViewerMeResponse =
  | { authenticated: false }
  | { authenticated: true; username: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(BASE + path, {
    credentials: "include",
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function register(username: string, password: string, inviteCode: string) {
  return request<{ ok: boolean; username: string }>("/register", {
    method: "POST",
    body: JSON.stringify({ username, password, inviteCode }),
  });
}

export function login(username: string, password: string) {
  return request<{ ok: boolean; username?: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>("/logout", { method: "POST" });
}

export function me() {
  return request<ViewerMeResponse>("/me");
}
