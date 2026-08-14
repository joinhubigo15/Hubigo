import { request } from "./shared";

// Originally lived in app/admin/lib/admin-api.ts — pulled out here alongside the rest of the
// deferred advertisements feature. Restore by pasting back into admin-api.ts (and dropping the
// `from "./shared"` import, since `request` is already defined in that file).

export interface AdminAdvertisement {
  id: string;
  title: string;
  targetCityId: string | null;
  targetCityName: string | null;
  placement: string;
  status: string;
  impressions: number;
  clicks: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getAdminAdvertisements = () => request<AdminAdvertisement[]>("/advertisements");
export const createAdminAdvertisement = (input: { title: string; targetCityId?: string; placement: string; startDate?: string; endDate?: string }) =>
  request<AdminAdvertisement>("/advertisements", { method: "POST", body: JSON.stringify(input) });
export const updateAdminAdvertisement = (id: string, input: Partial<{ title: string; targetCityId: string; placement: string; status: string; startDate: string; endDate: string }>) =>
  request<AdminAdvertisement>(`/advertisements/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteAdminAdvertisement = (id: string) => request(`/advertisements/${id}`, { method: "DELETE" });
