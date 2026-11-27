import { apiFetch } from './apiClient';

export interface BusinessProfile {
  id?: string;
  business_id?: string;
  profile_id?: string;
  company_name?: string;
  companyName?: string;
  name?: string;
  reg_no?: string;
  registration_number?: string;
  description?: string | null;
  avatar?: string | null;
  create_date?: string;
  approved?: number | boolean | string;
  user_id?: string;
}

export function isApproved(bp: BusinessProfile): boolean {
  const v = bp.approved;
  return v === true || v === 1 || v === '1' || v === 'approved' || v === 'verified';
}

export function getBusinessId(bp: BusinessProfile): string | undefined {
  return bp.id ?? bp.business_id ?? bp.profile_id;
}

export function getBusinessName(bp: BusinessProfile): string {
  return bp.company_name ?? bp.companyName ?? bp.name ?? `Business #${getBusinessId(bp) ?? '?'}`;
}

export function listBusinessProfiles(): Promise<BusinessProfile[]> {
  return apiFetch<BusinessProfile[]>('/business/list');
}

export function getBusinessProfile(profileId: string): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>(`/business/get?business_id=${encodeURIComponent(profileId)}`);
}

export function createBusinessProfile(data: { company_name: string; reg_no: string; description?: string }): Promise<{ business_id: string } | { profile_id: string } | BusinessProfile> {
  return apiFetch('/business/create', { method: 'POST', json: data });
}

export function updateBusinessProfile(profileId: string, data: { company_name?: string; reg_no?: string; description?: string }): Promise<unknown> {
  return apiFetch('/business/update', { method: 'PUT', json: { business_id: profileId, ...data } });
}

export function updateBusinessAvatar(profileId: string, base64OrFormData: string | FormData): Promise<unknown> {
  if (typeof base64OrFormData !== 'string') {
    return apiFetch('/business/avatar', { method: 'POST', formData: base64OrFormData as FormData });
  }
  return apiFetch('/business/avatar', { method: 'POST', json: { business_id: profileId, avatar: base64OrFormData } });
}
