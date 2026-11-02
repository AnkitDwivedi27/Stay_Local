import {
  AccommodationRecord,
  DestinationRecord,
  ExperienceRecord,
  AuthUser,
  BookingRecord,
  CreateBookingPayload,
  CreateListingPayload,
  UpdateListingPayload,
  EligibleHostRecord,
  AssignHostPayload,
  ReassignHostPayload,
  SubmitHostAuthorizationPayload,
  GuideProfileRecord,
  GuideExperienceRecord,
  GuideBookingRecord,
  UpdateGuideProfilePayload,
  SubmitGuideVerificationPayload,
  CreateGuideExperiencePayload,
  UpdateGuideExperiencePayload,
  CreateGuideBookingPayload,
  LocalTreasureRecord,
  CreateTreasurePayload,
  UpdateTreasurePayload,
  TreasureCategory,
  TreasureVerificationStatus,
} from '../types';
import { DESTINATIONS_DATA } from '../data/destinations';
import { ACCOMMODATIONS_DATA } from '../data/accommodations';
import { EXPERIENCES_DATA } from '../data/experiences';
import { LOCAL_TREASURES_DATA } from '../data/local-treasures';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role?: 'tourist' | 'host' | 'guide';
  phone?: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    status: string;
    configured: boolean;
  };
}

let _isUsingFallback = false;

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'NetworkError') {
    return true;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('eacces') ||
      msg.includes('load failed')
    );
  }
  return false;
}

function parseApiError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const errorObj = (data as { error?: { message?: string; details?: Array<{ message?: string }> } }).error;
    if (errorObj?.details && Array.isArray(errorObj.details) && errorObj.details.length > 0) {
      const details = errorObj.details
        .map((d) => d?.message)
        .filter(Boolean)
        .join('. ');
      if (details) return details;
    }
    if (errorObj?.message) {
      return errorObj.message;
    }
  }
  return fallback;
}

export const apiService = {
  isUsingFallback(): boolean {
    return _isUsingFallback;
  },

  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
      const data = await res.json();
      _isUsingFallback = false;
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.warn('[StayLocal API] Backend is unreachable. Running in client-side offline mode.');
      }
      return {
        status: 'offline',
        service: 'StayLocal API (Offline Mode)',
        version: '0.1.0',
        uptimeSeconds: 0,
        environment: 'client-offline',
        database: {
          status: 'disconnected',
          configured: false,
        },
      };
    }
  },

  async getDestinations(filters?: { search?: string; district?: string }): Promise<DestinationRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.district) params.append('district', filters.district);

      const url = `${API_BASE_URL}/destinations?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errorMsg = errorJson?.error?.message || `HTTP ${res.status}: Failed to fetch destinations`;
        throw new Error(errorMsg);
      }

      const json = await res.json();
      _isUsingFallback = false;
      return json.data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.info('[StayLocal API] Using local research fallback for destinations');
        let result = [...DESTINATIONS_DATA];
        if (filters?.district) {
          const d = filters.district.toLowerCase();
          result = result.filter((item) => item.district.toLowerCase().includes(d));
        }
        if (filters?.search) {
          const s = filters.search.toLowerCase().trim();
          result = result.filter(
            (item) =>
              item.name.toLowerCase().includes(s) ||
              item.district.toLowerCase().includes(s) ||
              item.tagline.toLowerCase().includes(s)
          );
        }
        return result;
      }
      throw err;
    }
  },

  async getDestinationById(id: string): Promise<DestinationRecord | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/destinations/${id}`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error?.message || `Failed to fetch destination: ${id}`);
      }
      const json = await res.json();
      _isUsingFallback = false;
      return json.data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.info(`[StayLocal API] Using local research fallback for destination '${id}'`);
        return DESTINATIONS_DATA.find((d) => d.id.toLowerCase() === id.toLowerCase()) || null;
      }
      throw err;
    }
  },

  async getStays(filters?: {
    destination?: string;
    district?: string;
    category?: string;
    verificationStatus?: string;
    minGuests?: number;
  }): Promise<AccommodationRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.district) params.append('district', filters.district);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
      if (filters?.minGuests) params.append('minGuests', String(filters.minGuests));

      const res = await fetch(`${API_BASE_URL}/stays?${params.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errorMsg = errorJson?.error?.message || `HTTP ${res.status}: Failed to fetch stays`;
        throw new Error(errorMsg);
      }

      const json = await res.json();
      _isUsingFallback = false;
      return json.data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.info('[StayLocal API] Using local research fallback for stays');
        let result = [...ACCOMMODATIONS_DATA];
        if (filters?.district) {
          const dist = filters.district.toLowerCase();
          result = result.filter((s) => s.district.toLowerCase().includes(dist));
        }
        if (filters?.destination) {
          const dest = filters.destination.toLowerCase();
          result = result.filter(
            (s) =>
              s.locality.toLowerCase().includes(dest) ||
              s.address.toLowerCase().includes(dest) ||
              s.district.toLowerCase().includes(dest)
          );
        }
        if (filters?.category) {
          result = result.filter((s) => s.category === filters.category);
        }
        if (filters?.verificationStatus) {
          result = result.filter((s) => s.verificationStatus === filters.verificationStatus);
        }
        if (filters?.minGuests) {
          result = result.filter((s) => (s.guestCapacity?.maxGuests ?? 0) >= filters.minGuests!);
        }
        return result;
      }
      throw err;
    }
  },

  async getStayById(id: string): Promise<AccommodationRecord | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/stays/${id}`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error?.message || `Failed to fetch stay: ${id}`);
      }
      const json = await res.json();
      _isUsingFallback = false;
      return json.data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.info(`[StayLocal API] Using local research fallback for stay '${id}'`);
        return ACCOMMODATIONS_DATA.find((s) => s.id.toLowerCase() === id.toLowerCase()) || null;
      }
      throw err;
    }
  },

  async getExperiences(filters?: {
    category?: string;
    destinationId?: string;
    district?: string;
  }): Promise<ExperienceRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.destinationId) params.append('destinationId', filters.destinationId);
      if (filters?.district) params.append('district', filters.district);

      const res = await fetch(`${API_BASE_URL}/experiences?${params.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errorMsg = errorJson?.error?.message || `HTTP ${res.status}: Failed to fetch experiences`;
        throw new Error(errorMsg);
      }

      const json = await res.json();
      _isUsingFallback = false;
      return json.data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.info('[StayLocal API] Using local research fallback for experiences');
        let result = [...EXPERIENCES_DATA];
        if (filters?.category) {
          result = result.filter((e) => e.category === filters.category);
        }
        if (filters?.destinationId) {
          result = result.filter((e) => e.destinationId.toLowerCase() === filters.destinationId!.toLowerCase());
        }
        if (filters?.district) {
          result = result.filter((e) => e.district.toLowerCase().includes(filters.district!.toLowerCase()));
        }
        return result;
      }
      throw err;
    }
  },

  async getExperienceById(id: string): Promise<ExperienceRecord | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/experiences/${id}`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.error?.message || `Failed to fetch experience: ${id}`);
      }
      const json = await res.json();
      _isUsingFallback = false;
      return json.data;
    } catch (err) {
      if (isNetworkError(err)) {
        _isUsingFallback = true;
        console.info(`[StayLocal API] Using local research fallback for experience '${id}'`);
        return EXPERIENCES_DATA.find((e) => e.id.toLowerCase() === id.toLowerCase()) || null;
      }
      throw err;
    }
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Registration failed (${res.status})`);
      throw new Error(msg);
    }

    return data.data.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Sign in failed (${res.status})`);
      throw new Error(msg);
    }

    return data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[StayLocal Auth] Logout network warning', err);
    }
  },

  async getMe(): Promise<AuthUser | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      return data?.data?.user || null;
    } catch {
      return null;
    }
  },

  async createBooking(payload: CreateBookingPayload): Promise<BookingRecord> {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Booking failed (${res.status})`);
      throw new Error(msg);
    }
    return data.data.booking;
  },

  async getMyBookings(): Promise<BookingRecord[]> {
    const res = await fetch(`${API_BASE_URL}/bookings/my`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch bookings (${res.status})`);
      throw new Error(msg);
    }
    return data.data.bookings || [];
  },

  async getBookingById(id: string): Promise<BookingRecord> {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch booking (${res.status})`);
      throw new Error(msg);
    }
    return data.data.booking;
  },

  async cancelBooking(id: string, reason?: string): Promise<BookingRecord> {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to cancel booking (${res.status})`);
      throw new Error(msg);
    }
    return data.data.booking;
  },

  async getHostBookings(): Promise<BookingRecord[]> {
    const res = await fetch(`${API_BASE_URL}/host/bookings`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch host bookings (${res.status})`);
      throw new Error(msg);
    }
    return data.data.bookings || [];
  },

  async confirmBooking(id: string): Promise<BookingRecord> {
    const res = await fetch(`${API_BASE_URL}/host/bookings/${id}/confirm`, {
      method: 'PATCH',
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to confirm booking (${res.status})`);
      throw new Error(msg);
    }
    return data.data.booking;
  },

  async rejectBooking(id: string, reason?: string): Promise<BookingRecord> {
    const res = await fetch(`${API_BASE_URL}/host/bookings/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to decline booking (${res.status})`);
      throw new Error(msg);
    }
    return data.data.booking;
  },

  // Host Listing Management API
  async getHostListings(): Promise<AccommodationRecord[]> {
    const res = await fetch(`${API_BASE_URL}/host/listings`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch host listings (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listings || [];
  },

  async getHostListingById(id: string): Promise<AccommodationRecord & { activeBookingsCount?: number }> {
    const res = await fetch(`${API_BASE_URL}/host/listings/${id}`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch listing (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async createHostListing(payload: CreateListingPayload): Promise<AccommodationRecord> {
    const res = await fetch(`${API_BASE_URL}/host/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to create listing (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async updateHostListing(id: string, payload: UpdateListingPayload): Promise<AccommodationRecord> {
    const res = await fetch(`${API_BASE_URL}/host/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to update listing (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async submitListingForVerification(
    id: string,
    payload: string | SubmitHostAuthorizationPayload
  ): Promise<AccommodationRecord> {
    const body = typeof payload === 'string' ? { submissionEvidence: payload } : payload;
    const res = await fetch(`${API_BASE_URL}/host/listings/${id}/submit-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to submit for verification (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async deactivateHostListing(id: string, reason?: string): Promise<{ listing: AccommodationRecord; message: string }> {
    const res = await fetch(`${API_BASE_URL}/host/listings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to deactivate listing (${res.status})`);
      throw new Error(msg);
    }
    return {
      listing: data.data.listing,
      message: data.message,
    };
  },

  // Admin Verification Queue API
  async getAdminVerificationQueue(params?: { status?: string; district?: string }): Promise<AccommodationRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.district) searchParams.set('district', params.district);

    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/admin/verification-queue${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch admin verification queue (${res.status})`);
      throw new Error(msg);
    }
    return data.data.queue || [];
  },

  async getAdminListingDetails(id: string): Promise<AccommodationRecord & { hostUser?: Partial<AuthUser>; bookings?: BookingRecord[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/listings/${id}`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch admin listing details (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async adminVerifyListing(
    id: string,
    action: 'approve' | 'reject' | 'request_info',
    reason: string
  ): Promise<AccommodationRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/listings/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, reason }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to ${action} listing (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async adminSuspendListing(id: string, reason: string): Promise<AccommodationRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/listings/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to suspend listing (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  // Admin Host Assignment Management API
  async getAdminHostAssignments(filters?: {
    search?: string;
    district?: string;
    locality?: string;
    status?: string;
  }): Promise<{ stays: AccommodationRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.district) params.set('district', filters.district);
    if (filters?.locality) params.set('locality', filters.locality);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);

    const qs = params.toString();
    const res = await fetch(`${API_BASE_URL}/admin/host-assignments${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch host assignments (${res.status})`);
      throw new Error(msg);
    }
    return data.data;
  },

  async getAdminEligibleHosts(search?: string): Promise<EligibleHostRecord[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);

    const qs = params.toString();
    const res = await fetch(`${API_BASE_URL}/admin/eligible-hosts${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch eligible hosts (${res.status})`);
      throw new Error(msg);
    }
    return data.data || [];
  },

  async adminAssignHost(payload: AssignHostPayload): Promise<AccommodationRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/host-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to assign host (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async adminReassignHost(stayId: string, payload: ReassignHostPayload): Promise<AccommodationRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/host-assignments/${stayId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to reassign host (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listing;
  },

  async adminUnassignHost(stayId: string, reason?: string): Promise<{ listing: AccommodationRecord; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/host-assignments/${stayId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to unassign host (${res.status})`);
      throw new Error(msg);
    }
    return data.data;
  },

  async getHostAssignedListings(): Promise<AccommodationRecord[]> {
    const res = await fetch(`${API_BASE_URL}/host/assigned-listings`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = parseApiError(data, `Failed to fetch assigned listings (${res.status})`);
      throw new Error(msg);
    }
    return data.data.listings || [];
  },

  // ==========================================
  // GUIDE DISCOVERY & BOOKING API METHODS
  // ==========================================

  async getMyGuideProfile(): Promise<GuideProfileRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/profile`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch guide profile'));
    }
    return data.data.profile;
  },

  async updateMyGuideProfile(payload: UpdateGuideProfilePayload): Promise<GuideProfileRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to update guide profile'));
    }
    return data.data.profile;
  },

  async submitGuideVerification(payload: SubmitGuideVerificationPayload): Promise<GuideProfileRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/profile/submit-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to submit guide verification'));
    }
    return data.data.profile;
  },

  async getMyGuideExperiences(): Promise<GuideExperienceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/guide/experiences`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch guide experiences'));
    }
    return data.data.experiences || [];
  },

  async createGuideExperience(payload: CreateGuideExperiencePayload): Promise<GuideExperienceRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/experiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to create guide experience'));
    }
    return data.data.experience;
  },

  async updateGuideExperience(id: string, payload: UpdateGuideExperiencePayload): Promise<GuideExperienceRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/experiences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to update guide experience'));
    }
    return data.data.experience;
  },

  async publishGuideExperience(id: string): Promise<GuideExperienceRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/experiences/${id}/publish`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to publish guide experience'));
    }
    return data.data.experience;
  },

  async unpublishGuideExperience(id: string): Promise<GuideExperienceRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/experiences/${id}/unpublish`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to unpublish guide experience'));
    }
    return data.data.experience;
  },

  async deleteGuideExperience(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/guide/experiences/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to delete guide experience'));
    }
  },

  async getMyGuideIncomingBookings(): Promise<GuideBookingRecord[]> {
    const res = await fetch(`${API_BASE_URL}/guide/bookings`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch incoming guide bookings'));
    }
    return data.data.bookings || [];
  },

  async respondToGuideBooking(id: string, action: 'confirm' | 'reject', reason?: string): Promise<GuideBookingRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/bookings/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, reason }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to respond to booking'));
    }
    return data.data.booking;
  },

  async completeGuideBooking(id: string): Promise<GuideBookingRecord> {
    const res = await fetch(`${API_BASE_URL}/guide/bookings/${id}/complete`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to complete guide booking'));
    }
    return data.data.booking;
  },

  // Public Discovery
  async getPublicGuides(params?: { district?: string; locality?: string; search?: string }): Promise<GuideProfileRecord[]> {
    const q = new URLSearchParams();
    if (params?.district) q.set('district', params.district);
    if (params?.locality) q.set('locality', params.locality);
    if (params?.search) q.set('search', params.search);

    const res = await fetch(`${API_BASE_URL}/public/guides?${q.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to discover guides'));
    }
    return data.data.guides || [];
  },

  async getPublicGuideById(id: string): Promise<{ guide: GuideProfileRecord; experiences: GuideExperienceRecord[] }> {
    const res = await fetch(`${API_BASE_URL}/public/guides/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch guide details'));
    }
    return data.data;
  },

  async getGuidesForDestination(params: {
    stayId?: string;
    bookingId?: string;
    district?: string;
    locality?: string;
  }): Promise<{ district: string; locality: string; guides: GuideProfileRecord[]; experiences: GuideExperienceRecord[] }> {
    const q = new URLSearchParams();
    if (params.stayId) q.set('stayId', params.stayId);
    if (params.bookingId) q.set('bookingId', params.bookingId);
    if (params.district) q.set('district', params.district);
    if (params.locality) q.set('locality', params.locality);

    const res = await fetch(`${API_BASE_URL}/public/guides/destination?${q.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to discover destination guides'));
    }
    return data.data;
  },

  async getPublicGuideExperiences(params?: {
    district?: string;
    locality?: string;
    category?: string;
    guideId?: string;
  }): Promise<GuideExperienceRecord[]> {
    const q = new URLSearchParams();
    if (params?.district) q.set('district', params.district);
    if (params?.locality) q.set('locality', params.locality);
    if (params?.category) q.set('category', params.category);
    if (params?.guideId) q.set('guideId', params.guideId);

    const res = await fetch(`${API_BASE_URL}/public/guide-experiences?${q.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch guide experiences'));
    }
    return data.data.experiences || [];
  },

  async getPublicGuideExperienceById(id: string): Promise<{ experience: GuideExperienceRecord; guide: GuideProfileRecord }> {
    const res = await fetch(`${API_BASE_URL}/public/guide-experiences/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch experience details'));
    }
    return data.data;
  },

  // Tourist Bookings
  async createGuideBooking(payload: CreateGuideBookingPayload): Promise<GuideBookingRecord> {
    const res = await fetch(`${API_BASE_URL}/guide-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Guide booking failed'));
    }
    return data.data.booking;
  },

  async getTouristGuideBookings(): Promise<GuideBookingRecord[]> {
    const res = await fetch(`${API_BASE_URL}/guide-bookings/my`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch your guide bookings'));
    }
    return data.data.bookings || [];
  },

  async cancelGuideBooking(id: string, reason?: string): Promise<GuideBookingRecord> {
    const res = await fetch(`${API_BASE_URL}/guide-bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to cancel guide booking'));
    }
    return data.data.booking;
  },

  // Admin Guide Management
  async adminGetAllGuides(): Promise<GuideProfileRecord[]> {
    const res = await fetch(`${API_BASE_URL}/admin/guides`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to retrieve guides'));
    }
    return data.data.guides || [];
  },

  async adminReviewGuide(
    id: string,
    action: 'approve' | 'reject' | 'suspend' | 'reactivate',
    notes?: string
  ): Promise<GuideProfileRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/guides/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, notes }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to review guide'));
    }
    return data.data.guide;
  },

  async adminGetAllGuideExperiences(): Promise<GuideExperienceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/admin/guide-experiences`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch experiences for admin'));
    }
    return data.data.experiences || [];
  },

  async adminDeleteGuideExperience(id: string, reason?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/guide-experiences/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to delete guide experience'));
    }
  },

  // ==========================================
  // Discover Local Treasures (Artisans & Crafts)
  // ==========================================

  async getTreasuresForDestination(params: {
    stayId?: string;
    bookingId?: string;
    district?: string;
    locality?: string;
    category?: TreasureCategory;
  }): Promise<{ district: string; locality: string; treasures: LocalTreasureRecord[] }> {
    const q = new URLSearchParams();
    if (params.stayId) q.set('stayId', params.stayId);
    if (params.bookingId) q.set('bookingId', params.bookingId);
    if (params.district) q.set('district', params.district);
    if (params.locality) q.set('locality', params.locality);
    if (params.category) q.set('category', params.category);

    try {
      const res = await fetch(`${API_BASE_URL}/public/treasures/destination?${q.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseApiError(data, 'Failed to discover local treasures'));
      }
      return data.data;
    } catch (err) {
      if (isNetworkError(err)) {
        // Fallback filter
        const targetDistrict = params.district || '';
        const targetLocality = params.locality || '';
        const filtered = LOCAL_TREASURES_DATA.filter((t) => {
          if (t.verificationStatus !== 'verified' || !t.isActive) return false;
          if (params.category && t.category !== params.category) return false;
          const matchDist = targetDistrict ? t.district.toLowerCase() === targetDistrict.toLowerCase() : false;
          const matchLoc = targetLocality
            ? t.locality.toLowerCase().includes(targetLocality.toLowerCase()) ||
              t.nearbyClusters.some((c) => c.toLowerCase().includes(targetLocality.toLowerCase()))
            : false;
          return matchDist || matchLoc;
        });
        return {
          district: targetDistrict,
          locality: targetLocality,
          treasures: filtered,
        };
      }
      throw err;
    }
  },

  async getPublicTreasures(params?: {
    search?: string;
    district?: string;
    locality?: string;
    category?: TreasureCategory;
  }): Promise<LocalTreasureRecord[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.district) q.set('district', params.district);
    if (params?.locality) q.set('locality', params.locality);
    if (params?.category) q.set('category', params.category);

    try {
      const res = await fetch(`${API_BASE_URL}/public/treasures?${q.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseApiError(data, 'Failed to fetch local treasures'));
      }
      return data.data.treasures || [];
    } catch (err) {
      if (isNetworkError(err)) {
        return LOCAL_TREASURES_DATA.filter((t) => t.verificationStatus === 'verified' && t.isActive);
      }
      throw err;
    }
  },

  async getPublicTreasureById(id: string): Promise<LocalTreasureRecord> {
    try {
      const res = await fetch(`${API_BASE_URL}/public/treasures/${id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseApiError(data, 'Failed to fetch treasure details'));
      }
      return data.data.treasure;
    } catch (err) {
      if (isNetworkError(err)) {
        const found = LOCAL_TREASURES_DATA.find((t) => t.id === id);
        if (found) return found;
      }
      throw err;
    }
  },

  // Admin Treasures
  async adminGetAllTreasures(params?: {
    search?: string;
    district?: string;
    category?: TreasureCategory;
    verificationStatus?: TreasureVerificationStatus;
    isActive?: boolean;
  }): Promise<LocalTreasureRecord[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.district) q.set('district', params.district);
    if (params?.category) q.set('category', params.category);
    if (params?.verificationStatus) q.set('verificationStatus', params.verificationStatus);
    if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));

    try {
      const res = await fetch(`${API_BASE_URL}/admin/treasures?${q.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseApiError(data, 'Failed to retrieve treasures for admin'));
      }
      return data.data.treasures || [];
    } catch (err) {
      if (isNetworkError(err)) {
        return [...LOCAL_TREASURES_DATA];
      }
      throw err;
    }
  },

  async adminGetTreasureById(id: string): Promise<LocalTreasureRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/treasures/${id}`, {
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to fetch treasure for admin'));
    }
    return data.data.treasure;
  },

  async adminCreateTreasure(payload: CreateTreasurePayload): Promise<LocalTreasureRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/treasures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to create treasure'));
    }
    return data.data.treasure;
  },

  async adminUpdateTreasure(id: string, payload: UpdateTreasurePayload): Promise<LocalTreasureRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/treasures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to update treasure'));
    }
    return data.data.treasure;
  },

  async adminReviewTreasure(
    id: string,
    action: 'approve' | 'reject' | 'deactivate' | 'activate',
    notes?: string
  ): Promise<LocalTreasureRecord> {
    const res = await fetch(`${API_BASE_URL}/admin/treasures/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, notes }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(parseApiError(data, 'Failed to review treasure status'));
    }
    return data.data.treasure;
  },
};
