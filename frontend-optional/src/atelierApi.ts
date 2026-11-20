export type DesignBrief = {
  vehicle_id: string;
  exterior_theme_id?: string;
  interior_theme_id?: string;
  personality?: string;
  priority?: string;
  custom_prompt?: string;
};

const API = import.meta.env.VITE_ATELIER_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const atelierApi = {
  vehicles: () => request<any[]>("/api/v1/vehicles"),
  options: (vehicleId: string) => request<any>(`/api/v1/vehicles/${vehicleId}/options`),
  themes: (vehicleId: string) => request<any>(`/api/v1/themes?vehicle_id=${vehicleId}`),
  generate: (brief: DesignBrief) =>
    request<any>("/api/v1/ai/generate", { method: "POST", body: JSON.stringify({ brief, count: 3 }) }),
  update: (id: string, changes: Record<string, string>) =>
    request<any>(`/api/v1/configurations/${id}`, { method: "PATCH", body: JSON.stringify({ changes }) }),
};
