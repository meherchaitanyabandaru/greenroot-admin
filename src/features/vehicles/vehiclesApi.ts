import { baseApi } from '../../api/baseApi';

// Lorry owners (no GreenRoot account needed), GreenRoot's approval of each
// lorry, and of each driver's link to a lorry.

export const LORRY_TYPES = ['TRUCK', 'VAN', 'PICKUP', 'AUTO'] as const;
export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export const LINK_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'REMOVED'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

/** Moves the API allows for a link (vehicles/owners.go linkTransitions). */
export const LINK_ACTIONS: Record<string, { status: LinkStatus; label: string; needsNote: boolean }[]> = {
  PENDING: [
    { status: 'APPROVED', label: 'Approve', needsNote: false },
    { status: 'REJECTED', label: 'Reject', needsNote: true },
  ],
  APPROVED: [
    { status: 'SUSPENDED', label: 'Suspend', needsNote: true },
    { status: 'REMOVED', label: 'Remove', needsNote: true },
  ],
  SUSPENDED: [
    { status: 'APPROVED', label: 'Reinstate', needsNote: false },
    { status: 'REMOVED', label: 'Remove', needsNote: true },
  ],
};

export type VehicleOwner = {
  id: number;
  name: string;
  mobile?: string | null;
  user_id?: number | null;
  has_account: boolean;
  notes?: string | null;
  vehicle_count: number;
  created_at: string;
};

export type VehicleDriverLink = {
  id: number;
  vehicle_id: number;
  vehicle_number: string;
  vehicle_type?: string | null;
  vehicle_approval_status: string;
  owner_name?: string | null;
  driver_user_id: number;
  driver_name?: string | null;
  driver_mobile?: string | null;
  driver_approval_status?: string | null;
  license_expiry_date?: string | null;
  status: LinkStatus;
  decision_note?: string | null;
  decided_at?: string | null;
  is_on_active_trip: boolean;
  created_at: string;
};

type Paged<K extends string, T> = Record<K, T[]> & { pagination: { total: number } };

export const vehiclesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listVehicleOwners: builder.query<Paged<'owners', VehicleOwner>, { search?: string; page?: number; per_page?: number }>({
      query: (params) => ({ url: '/api/v1/vehicle-owners', params }),
      providesTags: ['Vehicles'],
    }),
    saveVehicleOwner: builder.mutation<{ owner: VehicleOwner }, { id?: number; name: string; mobile?: string | null; notes?: string | null }>({
      query: ({ id, ...body }) => ({ url: id ? `/api/v1/vehicle-owners/${id}` : '/api/v1/vehicle-owners', method: id ? 'PUT' : 'POST', body }),
      invalidatesTags: ['Vehicles'],
    }),
    setVehicleApproval: builder.mutation<unknown, { id: number; status: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/v1/vehicles/${id}/approval`, method: 'PUT', body }),
      invalidatesTags: ['Vehicles', 'Drivers'],
    }),
    listVehicleLinks: builder.query<
      Paged<'links', VehicleDriverLink>,
      { status?: string; vehicle_id?: number; driver_user_id?: number; search?: string; page?: number; per_page?: number }
    >({
      query: (params) => ({ url: '/api/v1/vehicle-drivers', params }),
      providesTags: ['Vehicles'],
    }),
    setVehicleLinkStatus: builder.mutation<{ link: VehicleDriverLink }, { id: number; status: LinkStatus; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/v1/vehicle-drivers/${id}/status`, method: 'PUT', body }),
      invalidatesTags: ['Vehicles', 'Drivers'],
    }),
  }),
});

export const {
  useListVehicleOwnersQuery,
  useSaveVehicleOwnerMutation,
  useSetVehicleApprovalMutation,
  useListVehicleLinksQuery,
  useSetVehicleLinkStatusMutation,
} = vehiclesApi;
