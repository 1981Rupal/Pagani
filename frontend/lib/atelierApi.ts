export type DesignBrief = {
  vehicle_id: string;
  exterior_theme_id?: string;
  interior_theme_id?: string;
  personality?: string;
  priority?: string;
  custom_prompt?: string;
  creativity?: string;
};

export type Vehicle = {
  id: string;
  name: string;
};

export type VehicleOptions = {
  vehicle_id: string;
  options: Record<string, string[]>;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  values: Record<string, string>;
};

export type ThemesResponse = {
  vehicle_id: string;
  exterior: Theme[];
  interior: Theme[];
};

export type VehicleConfiguration = {
  id?: string;
  vehicle_id: string;
  exterior: Record<string, string>;
  wheels: Record<string, string>;
  interior: Record<string, string>;
  bespoke: Record<string, string>;
  design_personality?: string;
  source?: string;
  proposal_name?: string;
  validation_warnings?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ConsultResponse = {
  vehicle_id: string;
  interpreted_configuration: VehicleConfiguration;
  warnings: string[];
  requires_customer_review: boolean;
};

export type GenerateResponse = {
  vehicle_id: string;
  proposals: VehicleConfiguration[];
  note: string;
};

export type PatchResponse = {
  configuration: VehicleConfiguration;
  warnings: string[];
};

const BASE_URL =
  process.env.NEXT_PUBLIC_ATELIER_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = `Error ${res.status} (${res.statusText})`;
      try {
        const errJson = await res.json();
        if (errJson.detail) detail = String(errJson.detail);
      } catch {
        const text = await res.text();
        if (text) detail = text;
      }
      throw new Error(detail);
    }

    return (await res.json()) as T;
  } catch (error: any) {
    if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
      throw new Error(
        `Unable to reach Pagani Atelier backend at ${BASE_URL}. Ensure FastAPI is running on port 8000.`
      );
    }
    throw error;
  }
}

export const atelierApi = {
  health: () => request<{ status: string; service: string }>("/health"),

  vehicles: () => request<Vehicle[]>("/api/v1/vehicles"),

  options: (vehicleId: string) =>
    request<VehicleOptions>(`/api/v1/vehicles/${encodeURIComponent(vehicleId)}/options`),

  themes: (vehicleId: string = "pagani_utopia") =>
    request<ThemesResponse>(`/api/v1/themes?vehicle_id=${encodeURIComponent(vehicleId)}`),

  consult: (brief: DesignBrief) =>
    request<ConsultResponse>("/api/v1/ai/consult", {
      method: "POST",
      body: JSON.stringify(brief),
    }),

  generate: (brief: DesignBrief, count: number = 3) =>
    request<GenerateResponse>("/api/v1/ai/generate", {
      method: "POST",
      body: JSON.stringify({ brief, count }),
    }),

  getConfiguration: (id: string) =>
    request<VehicleConfiguration>(`/api/v1/configurations/${encodeURIComponent(id)}`),

  patchConfiguration: (id: string, changes: Record<string, string>) =>
    request<PatchResponse>(`/api/v1/configurations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ changes }),
    }),
};

