import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api",
  timeout: 8000,
  withCredentials: true,
});

export interface SessionSummary {
  key: string;
  ttl: number;
  value: unknown;
}

export interface DatabaseStatus {
  database: string;
  current_time: string;
  dsn: string;
}

export async function fetchHealth() {
  const { data } = await api.get("/health");
  return data as { status: string; environment: string; timestamp: string };
}

export async function fetchDatabaseStatus() {
  const { data } = await api.get<DatabaseStatus>("/db/status");
  return data;
}

export async function fetchSessions(limit = 20) {
  const { data } = await api.get("/redis/sessions", {
    params: { limit },
  });
  return data.sessions as SessionSummary[];
}

export async function fetchWhoAmI() {
  const { data } = await api.get("/session/whoami");
  return data;
}

export default api;
