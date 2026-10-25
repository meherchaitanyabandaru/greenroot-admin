// Request and response types of the admin API (endpoints: adminResources.ts).
import type { Pagination } from './apiTypes';

export type ResourceConfig = {
  key: string;
  tag:
    | 'Users'
    | 'Plants'
    | 'Nurseries'
    | 'TopItems'
    | 'Orders'
    | 'Quotations'
    | 'Payments'
    | 'Dispatches'
    | 'Vehicles'
    | 'Drivers'
    | 'Tracking'
    | 'Notifications'
    | 'Subscriptions'
    | 'Attachments'
    | 'Sourcing'
    | 'Audit'
    | 'SecurityLogs';
  path?: string;
  collectionKey?: string;
  integrationNote?: string;
};

export type ResourceListResponse = {
  rows: Record<string, unknown>[];
  pagination?: Pagination;
};

export type OrderDetailResponse = {
  order: Record<string, unknown>;
};

export type QuotationDetailResponse = {
  quotation: Record<string, unknown>;
};

export type QuotationItemsResponse = {
  items: Record<string, unknown>[];
};

export type QuotationPDFResponse = {
  blob: Blob;
  filename?: string;
};

export type OrderItemsResponse = {
  items: Record<string, unknown>[];
};

export type RelatedPaymentsResponse = {
  payments: Record<string, unknown>[];
  pagination?: Pagination;
};

export type RelatedDispatchesResponse = {
  dispatches: Record<string, unknown>[];
  pagination?: Pagination;
};

export type UserDetailResponse = {
  user: Record<string, unknown>;
};

export type UserRolesResponse = {
  roles: Record<string, unknown>[];
};

export type UserSessionsResponse = {
  sessions: Record<string, unknown>[];
};

export type UserAddressesResponse = {
  addresses: Record<string, unknown>[];
};

export type NurseryDetailResponse = {
  nursery: Record<string, unknown>;
};

export type NurseryAddressesResponse = {
  addresses: Record<string, unknown>[];
};

export type NurseryUsersResponse = {
  users: Record<string, unknown>[];
};

export type LiveDriverLocationResponse = {
  location: Record<string, unknown> | null;
};

export type SubscriptionPromo = {
  id: number;
  promo_code: string;
  name: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_value: number;
  max_discount_cap?: number;
  applicable_plans: string[];
  applicable_cycles: string[];
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  max_uses?: number;
  used_count: number;
  created_by?: number;
  created_at: string;
  updated_at?: string;
};

export type SubscriptionPlan = {
  id: number;
  plan_code: string;
  plan_name: string;
  description?: string;
  monthly_price?: number;
  six_month_price?: number;
  yearly_price?: number;
  max_managers?: number;
  max_nurseries?: number;
  is_active: boolean;
  features?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type PlantDetailResponse = {
  plant: Record<string, unknown>;
};

/** A World Flora Online name not in the catalog yet (GET /plants/lookup). */
export type BotanicalName = {
  wfo_id: string;
  scientific_name: string;
  authorship?: string;
  family?: string;
  taxon_rank: string;
  status: 'ACCEPTED' | 'SYNONYM' | 'UNCHECKED';
  accepted_wfo_id?: string;
  accepted_name?: string;
};

/** Exactly one of plant (already in the catalog) or name is set. */
export type PlantLookupResult = {
  plant?: Record<string, unknown>;
  name?: BotanicalName;
};

/** A nursery's top item: its showcase, not stock (max 20 per nursery). */
export type TopItem = {
  id: number;
  top_item_code: string;
  nursery_id: number;
  nursery_name: string;
  plant_id: number;
  scientific_name: string;
  common_name?: string;
  size_id: number;
  size_code: string;
  size_name: string;
  unit_price?: number;
  display_order: number;
  quality_notes?: string;
  photos: string[];
  updated_at: string;
  version: number;
  capabilities?: { can_edit: boolean; can_delete: boolean };
};

export type TopItemListResponse = { top_items: TopItem[]; pagination: Pagination };

export type TopItemInput = {
  nursery_id?: number;
  plant_id: number;
  size_id: number;
  unit_price?: number | null;
  display_order?: number;
  quality_notes?: string | null;
  photos?: string[];
};

export type PlantSize = { id: number; size_code: string; display_name: string };

export type PlantLookupResponse = {
  results: PlantLookupResult[];
};

/** A row on Admin → Plants: one of the ~1.66 M botanical names. */
export type BotanicalRow = BotanicalName & {
  genus?: string;
  catalog_plant_id?: number;
  catalog_plant_code?: string;
  /** The catalog plant's common name; World Flora Online has none. */
  english_name?: string;
  /** Old names (synonyms) pointing to this name. */
  synonym_count?: number;
  /** The old name that matched the search, when this row's own name did not. */
  matched_name?: string;
};

export type BotanicalListParams = {
  page: number;
  per_page: number;
  search?: string;
  family?: string;
  status?: string;
  rank?: string;
  in_catalog?: string;
  show_synonyms?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type BotanicalListResponse = {
  names: BotanicalRow[];
  pagination: Pagination;
};

export type BotanicalFamily = { family: string; names: number; accepted: number; in_catalog: number };

export type BotanicalFamiliesResponse = { families: BotanicalFamily[]; total_names: number };

export type BotanicalDetailResponse = {
  name: BotanicalRow;
  accepted?: BotanicalRow;
  synonyms: BotanicalRow[];
  synonym_count: number;
};

/** A nursery's report of a local-market ad, for Admin → Local Market. */
export type MarketReport = {
  id: number;
  ad_id: number;
  ad_code: string;
  ad_title: string;
  ad_status: string;
  ad_nursery_name: string;
  ad_description?: string;
  ad_photos: string[];
  /** Ads of this nursery GreenRoot already removed. */
  ad_nursery_strikes: number;
  ad_nursery_blocked_until?: string;
  reason: string;
  /** Explicit images or a banned item: the ad was hidden on report. */
  serious: boolean;
  notes?: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  reported_by_name?: string;
  reported_by_nursery_name: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
};

export type MarketReportsResponse = { reports: MarketReport[]; pagination: Pagination };

/** Any market ad, as Admin → Local Market → All ads lists it. */
export type AdminMarketAd = {
  id: number;
  code: string;
  /** SELL offers plants; WANT asks for them (no price, no photos). */
  ad_type: 'SELL' | 'WANT';
  title: string;
  plant_name: string;
  description?: string;
  photos: string[];
  status: string;
  /** Why GreenRoot hid or removed it; the seller sees this. */
  moderation_note?: string;
  quantity?: number;
  price_per_unit?: number;
  price_unit?: string;
  view_count: number;
  enquiry_count: number;
  pending_reports: number;
  nursery_id: number;
  nursery_name: string;
  nursery_verified: boolean;
  nursery_strikes: number;
  nursery_blocked_until?: string;
  posted_by_name?: string;
  posted_by_photo?: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  size_description?: string;
  /** Wanted posts: the date the plants are needed by (YYYY-MM-DD). */
  needed_by?: string;
  /** False: the ad has no position, so nearby lists (60-100 km) never show it. */
  has_location: boolean;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_location_source?: string;
  pickup_address?: string;
  /** Where buyers collect ("pickup point"); required when there is no road. */
  pickup_landmark?: string;
  road_accessible?: boolean;
  truck_accessible?: boolean;
  access_instructions?: string;
  /** Owner soft delete (status DELETED). */
  deleted_at?: string;
  deleted_by_name?: string;
};

export type AdminMarketAdsResponse = { ads: AdminMarketAd[]; pagination: Pagination };
export type ModerationOutcome = { strikes: number; blocked_until?: string };
export type BlockedNursery = { nursery_id: number; nursery_name: string; strikes: number; blocked_until: string };

/** An uncaught error reported by the mobile or web app. */
export type CrashReport = {
  id: number;
  user_id?: number;
  user_name?: string;
  platform: 'android' | 'ios' | 'web';
  app_version: string;
  build_number?: string;
  os_version?: string;
  device_model?: string;
  error_type: string;
  message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  is_fatal: boolean;
  occurred_at: string;
  received_at: string;
};

export type CrashReportsResponse = { items: CrashReport[]; total: number };

export type PlantSuggestionStatus = 'PENDING' | 'APPROVED' | 'LINKED' | 'REJECTED';
export type PlantSuggestion = {
  id: number;
  name: string;
  scientific_name?: string;
  notes?: string;
  status: PlantSuggestionStatus;
  suggested_by_user_id: number;
  suggested_by_name?: string;
  suggested_by_mobile?: string;
  plant_id?: number;
  plant_name?: string;
  review_note?: string;
  reviewed_at?: string;
  created_at: string;
};
export type PlantSuggestionsResponse = { suggestions: PlantSuggestion[]; total: number };

/** Razorpay money that needs a manual action (API payment_issues). */
export type PaymentIssue = {
  id: number;
  issue_type: 'PAID_NOT_APPLIED' | 'REFUND_FAILED';
  provider: string;
  provider_order_id?: string;
  provider_payment_id: string;
  provider_refund_id?: string;
  user_id?: number;
  amount?: number;
  reason: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_note?: string;
  resolved_by_user_id?: number;
  resolved_at?: string;
  created_at: string;
};

export type PlantCareGuideResponse = {
  care_guide: Record<string, unknown>;
};
