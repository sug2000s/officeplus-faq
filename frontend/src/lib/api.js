import axios from "axios";
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE ?? "/api",
    timeout: 8000,
    withCredentials: true,
});
export async function fetchHealth() {
    const { data } = await api.get("/health");
    return data;
}
export async function fetchDatabaseStatus() {
    const { data } = await api.get("/db/status");
    return data;
}
export async function fetchSessions(limit = 20) {
    const { data } = await api.get("/redis/sessions", {
        params: { limit },
    });
    return data.sessions;
}
export async function fetchWhoAmI() {
    const { data } = await api.get("/session/whoami");
    return data;
}
export default api;
