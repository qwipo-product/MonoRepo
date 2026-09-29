import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createEmptyGeoScope, deriveStatus } from '../lib/promotion-copy';
import { relayPromotion } from '../lib/marketing-relay';
import type { GeoScope, ProductHierarchy, PromotionAsset, PromotionRecord, PromotionSurface } from '../types/campaign';

export { deriveStatus };

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function createEmptyProduct(): ProductHierarchy {
  return { company_ids: [], category_ids: [], brand_ids: [], sku_ids: [] };
}

function createEmptyDraft(): PromotionRecord {
  const now = new Date().toISOString();
  return {
    id: createId(),
    geo: createEmptyGeoScope(),
    product: createEmptyProduct(),
    campaign_title: '',
    display_name: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    surface: undefined,
    asset: {},
    push_notification_enabled: false,
    created_at: now,
    updated_at: now,
  };
}

const seedCampaigns: PromotionRecord[] = [
  {
    id: 'seed-1',
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-hyderabad'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-hyd-central-dist'],
      serviceable_area_ids: ['area-kukatpally', 'area-lb-nagar'],
    },
    product: {
      company_ids: ['company-itc'],
      category_ids: ['cat-staples'],
      brand_ids: ['brand-aashirvaad'],
      sku_ids: ['sku-atta-5kg', 'sku-atta-10kg'],
    },
    campaign_title: 'Monsoon Staples Drive',
    display_name: 'Monsoon Atta Mahotsav',
    start_date: '2026-08-12',
    end_date: '2026-08-31',
    status: 'live',
    surface: 'home_carousel',
    asset: {},
    push_notification_enabled: true,
    created_at: '2026-08-01T09:00:00.000Z',
    updated_at: '2026-08-12T09:00:00.000Z',
  },
  {
    id: 'seed-2',
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-hyderabad'],
      seller_type: 'wholesaler',
      vendor_ids: ['vendor-hyd-metro-whole'],
      serviceable_area_ids: ['area-gachibowli-corridor'],
    },
    product: {
      company_ids: ['company-parle', 'company-britannia'],
      category_ids: ['cat-snacks'],
      brand_ids: ['brand-parle', 'brand-britannia'],
      sku_ids: ['sku-parle-g-biscuit', 'sku-britannia-bread'],
    },
    campaign_title: 'Fresh Start Snacks Fest',
    display_name: 'Snack Time Savings',
    start_date: '2026-08-25',
    end_date: '2026-09-10',
    status: 'scheduled',
    surface: 'full_screen',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-08-10T09:00:00.000Z',
    updated_at: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'seed-3',
    geo: {
      country: 'India',
      state_ids: ['state-telangana', 'state-andhra-pradesh'],
      city_ids: [],
      seller_type: 'all',
      vendor_ids: [],
      serviceable_area_ids: [],
    },
    product: {
      company_ids: ['company-itc'],
      category_ids: ['cat-staples'],
      brand_ids: ['brand-aashirvaad'],
      sku_ids: [],
    },
    campaign_title: 'Aashirvaad Value Combo',
    display_name: 'Aashirvaad Value Combo Offer',
    start_date: '2026-09-05',
    end_date: '2026-09-30',
    status: 'draft',
    surface: 'product_list',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-08-14T09:00:00.000Z',
    updated_at: '2026-08-14T09:00:00.000Z',
  },
  {
    id: 'seed-4',
    geo: {
      country: 'India',
      state_ids: ['state-karnataka'],
      city_ids: ['city-bengaluru'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-blr-north-dist'],
      serviceable_area_ids: ['area-hebbal-route'],
    },
    product: {
      company_ids: ['company-adani-wilmar'],
      category_ids: ['cat-edible-oils'],
      brand_ids: ['brand-fortune'],
      sku_ids: ['sku-fortune-oil-1l'],
    },
    campaign_title: 'Summer Oil Saver',
    display_name: 'Summer Oil Saver Fest',
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    status: 'expired',
    surface: 'home_carousel',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-04-20T09:00:00.000Z',
    updated_at: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'seed-5',
    geo: {
      country: 'India',
      state_ids: ['state-tamil-nadu'],
      city_ids: ['city-chennai'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-chn-east-dist'],
      serviceable_area_ids: ['area-t-nagar-route', 'area-adyar-beat'],
    },
    product: {
      company_ids: ['company-tata-consumer'],
      category_ids: ['cat-salt-spices'],
      brand_ids: ['brand-tata-salt', 'brand-tata-sampann'],
      sku_ids: ['sku-tata-salt-1kg', 'sku-tata-sampann-toor-dal'],
    },
    campaign_title: 'Festive Kitchen Essentials',
    display_name: 'Festive Kitchen Stock-Up',
    start_date: '2026-08-20',
    end_date: '2026-09-15',
    status: 'live',
    surface: 'product_list',
    asset: {},
    push_notification_enabled: true,
    created_at: '2026-08-16T10:30:00.000Z',
    updated_at: '2026-08-20T09:00:00.000Z',
  },
  {
    id: 'seed-6',
    geo: {
      country: 'India',
      state_ids: ['state-maharashtra'],
      city_ids: ['city-mumbai'],
      seller_type: 'wholesaler',
      vendor_ids: ['vendor-andheri-whole'],
      serviceable_area_ids: [],
    },
    product: {
      company_ids: ['company-colgate-palmolive'],
      category_ids: ['cat-personal-care'],
      brand_ids: ['brand-colgate'],
      sku_ids: ['sku-colgate-toothpaste'],
    },
    campaign_title: 'Personal Care Power Week',
    display_name: 'Smile Bright Savings',
    start_date: '2026-08-18',
    end_date: '2026-08-28',
    status: 'live',
    surface: 'full_screen',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-08-15T08:15:00.000Z',
    updated_at: '2026-08-18T09:00:00.000Z',
  },
  {
    id: 'seed-7',
    geo: {
      country: 'India',
      state_ids: ['state-andhra-pradesh'],
      city_ids: ['city-visakhapatnam'],
      seller_type: 'wholesaler',
      vendor_ids: ['vendor-vizag-whole'],
      serviceable_area_ids: ['area-vizag-port'],
    },
    product: {
      company_ids: ['company-dabur'],
      category_ids: ['cat-personal-care'],
      brand_ids: ['brand-dabur'],
      sku_ids: ['sku-dabur-honey'],
    },
    campaign_title: 'Wellness Winter Prep',
    display_name: 'Dabur Honey Health Days',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    status: 'scheduled',
    surface: 'home_carousel',
    asset: {},
    push_notification_enabled: true,
    created_at: '2026-08-13T12:00:00.000Z',
    updated_at: '2026-08-13T12:00:00.000Z',
  },
  {
    id: 'seed-8',
    geo: {
      country: 'India',
      state_ids: ['state-karnataka'],
      city_ids: ['city-bengaluru', 'city-mysuru'],
      seller_type: 'all',
      vendor_ids: [],
      serviceable_area_ids: [],
    },
    product: {
      company_ids: ['company-britannia'],
      category_ids: ['cat-snacks'],
      brand_ids: ['brand-britannia'],
      sku_ids: ['sku-britannia-bread'],
    },
    campaign_title: 'Breakfast Booster Month',
    display_name: 'Morning Fresh Deals',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    status: 'scheduled',
    surface: 'product_list',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-08-11T15:45:00.000Z',
    updated_at: '2026-08-11T15:45:00.000Z',
  },
  {
    id: 'seed-9',
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-warangal'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-warangal-dist'],
      serviceable_area_ids: ['area-warangal-town', 'area-hanamkonda'],
    },
    product: {
      company_ids: ['company-adani-wilmar'],
      category_ids: ['cat-edible-oils'],
      brand_ids: ['brand-fortune'],
      sku_ids: ['sku-fortune-oil-5l'],
    },
    campaign_title: 'Bulk Oil Advantage',
    display_name: 'Fortune 5L Value Pack',
    start_date: '2026-09-10',
    end_date: '2026-10-10',
    status: 'draft',
    surface: 'home_carousel',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-08-09T09:20:00.000Z',
    updated_at: '2026-08-09T09:20:00.000Z',
  },
  {
    id: 'seed-10',
    geo: {
      country: 'India',
      state_ids: ['state-andhra-pradesh'],
      city_ids: ['city-vijayawada'],
      seller_type: 'distributor',
      vendor_ids: ['vendor-vijayawada-dist'],
      serviceable_area_ids: ['area-vijayawada-central'],
    },
    product: {
      company_ids: ['company-parle'],
      category_ids: ['cat-snacks'],
      brand_ids: ['brand-parle'],
      sku_ids: ['sku-parle-g-biscuit'],
    },
    campaign_title: 'Tea-Time Treats Push',
    display_name: 'Parle-G Chai Partner',
    start_date: '2026-07-01',
    end_date: '2026-07-31',
    status: 'expired',
    surface: 'product_list',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-06-25T11:00:00.000Z',
    updated_at: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'seed-11',
    geo: {
      country: 'India',
      state_ids: ['state-telangana'],
      city_ids: ['city-hyderabad'],
      seller_type: 'wholesaler',
      vendor_ids: ['vendor-secunderabad-whole'],
      serviceable_area_ids: ['area-secunderabad-cantonment'],
    },
    product: {
      company_ids: ['company-tata-consumer'],
      category_ids: ['cat-salt-spices'],
      brand_ids: ['brand-tata-sampann'],
      sku_ids: ['sku-tata-sampann-toor-dal'],
    },
    campaign_title: 'Dal Days Mega Offer',
    display_name: 'Protein-Rich Pantry',
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    status: 'archived',
    surface: 'full_screen',
    asset: {},
    push_notification_enabled: false,
    created_at: '2026-05-20T14:10:00.000Z',
    updated_at: '2026-07-05T09:00:00.000Z',
  },
  {
    id: 'seed-12',
    geo: {
      country: 'India',
      state_ids: ['state-karnataka'],
      city_ids: ['city-bengaluru'],
      seller_type: 'wholesaler',
      vendor_ids: ['vendor-whitefield-whole'],
      serviceable_area_ids: ['area-whitefield-tech-route', 'area-itpl-beat'],
    },
    product: {
      company_ids: ['company-itc', 'company-britannia'],
      category_ids: ['cat-staples', 'cat-snacks'],
      brand_ids: ['brand-aashirvaad', 'brand-britannia'],
      sku_ids: [],
    },
    campaign_title: 'Tech Corridor Combo Week',
    display_name: 'Whitefield Wholesale Fest',
    start_date: '2026-08-22',
    end_date: '2026-09-05',
    status: 'live',
    surface: 'home_carousel',
    asset: {},
    push_notification_enabled: true,
    created_at: '2026-08-07T16:40:00.000Z',
    updated_at: '2026-08-22T09:00:00.000Z',
  },
];

// Ordered promotion IDs per surface — index 0 is rank 1. One global order per surface; the
// Manage Ranking sheet's scope filters only narrow which rows are visible, they never split
// this into separate per-segment orders.
type RankOrders = Record<PromotionSurface, string[]>;

function createEmptyRankOrders(): RankOrders {
  return { full_screen: [], home_carousel: [], product_list: [] };
}

interface PromotionStore {
  currentStep: number;
  draft: PromotionRecord;
  editingId: string | null;
  campaigns: PromotionRecord[];
  rankings: RankOrders;

  updateGeo: (patch: Partial<GeoScope>) => void;
  updateProduct: (patch: Partial<ProductHierarchy>) => void;
  updateDraft: (
    patch: Partial<Pick<PromotionRecord, 'campaign_title' | 'display_name' | 'start_date' | 'end_date' | 'surface' | 'push_notification_enabled'>>,
  ) => void;
  updateAsset: (patch: Partial<PromotionAsset>) => void;

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepNumber: number) => void;

  resetDraft: () => void;
  startEditing: (id: string) => void;
  saveDraftRecord: () => void;
  publishPromotion: () => string;
  cloneCampaign: (id: string) => void;
  deleteCampaign: (id: string) => void;
  togglePushNotification: (id: string) => void;
  setRankOrders: (orders: Partial<RankOrders>) => void;
}

const clampStep = (stepNumber: number) => Math.min(4, Math.max(1, stepNumber));

export const usePromotionStore = create<PromotionStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      draft: createEmptyDraft(),
      editingId: null,
      campaigns: seedCampaigns,
      rankings: createEmptyRankOrders(),

      updateGeo: (patch) =>
        set((state) => ({
          draft: { ...state.draft, geo: { ...state.draft.geo, ...patch }, updated_at: new Date().toISOString() },
        })),

      updateProduct: (patch) =>
        set((state) => ({
          draft: { ...state.draft, product: { ...state.draft.product, ...patch }, updated_at: new Date().toISOString() },
        })),

      updateDraft: (patch) =>
        set((state) => ({
          draft: { ...state.draft, ...patch, updated_at: new Date().toISOString() },
        })),

      updateAsset: (patch) =>
        set((state) => ({
          draft: { ...state.draft, asset: { ...state.draft.asset, ...patch }, updated_at: new Date().toISOString() },
        })),

      nextStep: () => set((state) => ({ currentStep: clampStep(state.currentStep + 1) })),
      prevStep: () => set((state) => ({ currentStep: clampStep(state.currentStep - 1) })),
      goToStep: (stepNumber) => set({ currentStep: clampStep(stepNumber) }),

      resetDraft: () => set({ draft: createEmptyDraft(), currentStep: 1, editingId: null }),

      startEditing: (id) => {
        const record = get().campaigns.find((campaign) => campaign.id === id);
        if (!record) return;
        set({ draft: { ...record }, editingId: id, currentStep: 1 });
      },

      saveDraftRecord: () =>
        set((state) => {
          const record: PromotionRecord = { ...state.draft, status: 'draft', updated_at: new Date().toISOString() };
          const exists = state.campaigns.some((campaign) => campaign.id === record.id);
          const campaigns = exists
            ? state.campaigns.map((campaign) => (campaign.id === record.id ? record : campaign))
            : [record, ...state.campaigns];
          return { campaigns, draft: record };
        }),

      publishPromotion: () => {
        const state = get();
        const today = new Date().toISOString().slice(0, 10);
        const status = deriveStatus(state.draft.start_date, state.draft.end_date, today);
        const record: PromotionRecord = { ...state.draft, status, updated_at: new Date().toISOString() };
        const exists = state.campaigns.some((campaign) => campaign.id === record.id);
        const campaigns = exists
          ? state.campaigns.map((campaign) => (campaign.id === record.id ? record : campaign))
          : [record, ...state.campaigns];
        set({ campaigns, draft: createEmptyDraft(), currentStep: 1, editingId: null });

        // Live bridge to the buyer app — only surfaced promotions with a surface
        // assigned are demo-relevant; a full_screen/home_carousel/product_list
        // banner just published is exactly what the buyer app should pick up.
        if (record.surface && (status === 'live' || status === 'scheduled')) {
          relayPromotion({
            id: record.id,
            campaign_title: record.campaign_title,
            display_name: record.display_name,
            surface: record.surface,
            asset_data_url: record.asset.data_url,
            start_date: record.start_date,
            end_date: record.end_date,
            status,
          });
        }

        return record.id;
      },

      cloneCampaign: (id) =>
        set((state) => {
          const source = state.campaigns.find((campaign) => campaign.id === id);
          if (!source) return {};
          const now = new Date().toISOString();
          const clone: PromotionRecord = {
            ...source,
            id: createId(),
            campaign_title: `${source.campaign_title} (Copy)`,
            status: 'draft',
            push_notification_enabled: false,
            created_at: now,
            updated_at: now,
          };
          return { campaigns: [clone, ...state.campaigns] };
        }),

      deleteCampaign: (id) => set((state) => ({ campaigns: state.campaigns.filter((campaign) => campaign.id !== id) })),

      togglePushNotification: (id) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) =>
            campaign.id === id
              ? { ...campaign, push_notification_enabled: !campaign.push_notification_enabled, updated_at: new Date().toISOString() }
              : campaign,
          ),
        })),

      // Single batch write — the Manage Ranking sheet calls this once on Save, covering every
      // surface tab the admin touched in that session.
      setRankOrders: (orders) => set((state) => ({ rankings: { ...state.rankings, ...orders } })),
    }),
    {
      name: 'qwipo-promotion-store',
      storage: createJSONStorage(() => localStorage),
      // Asset previews are base64 data URLs — strip them before persisting so a few
      // large banner uploads can't blow past the localStorage quota. They stay in
      // memory for the current session (a real backend would return a CDN URL instead).
      partialize: (state) => ({
        ...state,
        draft: { ...state.draft, asset: { ...state.draft.asset, data_url: undefined } },
        campaigns: state.campaigns.map((campaign) => ({ ...campaign, asset: { ...campaign.asset, data_url: undefined } })),
      }),
      // v0 records predate the vendor_id -> vendor_ids move, v1 records predate the `rankings`
      // field, and v2 stores predate the expanded demo seed set — migrate all three so old
      // localStorage data doesn't crash and picks up the new seed campaigns.
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as {
          draft?: Record<string, unknown>;
          campaigns?: Array<Record<string, unknown>>;
          rankings?: Partial<RankOrders>;
        };

        const migrateGeo = (geo: Record<string, unknown> | undefined) => {
          if (!geo || Array.isArray(geo.vendor_ids)) return geo;
          const { vendor_id, ...rest } = geo as { vendor_id?: string };
          return { ...rest, vendor_ids: vendor_id ? [vendor_id] : [] };
        };

        const campaigns = Array.isArray(state?.campaigns)
          ? state.campaigns.map((campaign) => ({ ...campaign, geo: migrateGeo(campaign.geo as Record<string, unknown> | undefined) }))
          : [];
        // Append any seed campaigns this store hasn't seen yet (unless the admin
        // deliberately deleted nothing — deletions of non-seed rows are unaffected).
        const knownIds = new Set(campaigns.map((campaign) => (campaign as { id?: string }).id));
        const mergedCampaigns = [...campaigns, ...seedCampaigns.filter((seed) => !knownIds.has(seed.id))];

        return {
          ...state,
          draft: state?.draft ? { ...state.draft, geo: migrateGeo(state.draft.geo as Record<string, unknown> | undefined) } : state?.draft,
          campaigns: mergedCampaigns,
          rankings: { ...createEmptyRankOrders(), ...state?.rankings },
        } as unknown as PromotionStore;
      },
    },
  ),
);
