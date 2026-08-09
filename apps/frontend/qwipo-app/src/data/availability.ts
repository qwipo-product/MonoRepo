import { createContext, useContext, useMemo } from 'react';
import { homepage, sellers, products, savedAddresses } from './index';

/* Delivery-location → seller availability. bms fetches serviceable vendors from
   the backend using the address pincode + coordinates; every location can
   return a different set of sellers/distributors/products/delivery options.
   Here that geofencing is modelled as a static address→vendorIds map so the
   mockup shows the same behaviour: change the delivery address and the
   available distributors, wholesalers and their products change with it. */

// Which vendors deliver to each saved address (by address id). The vendor mix
// per address is what drives the home section availability (see availabilityFor):
// addr1 has both seller types, addr2 only distributors, addr3 only wholesalers.
export const serviceability: Record<string, string[]> = {
  addr1: ['dist-beat', 'dist-beat-tomorrow', 'dist-tomorrow', 'qwipo', 'jit-vendor', 'vff', 'sri-mahalakshmi'], // Hitech City — distributors + wholesalers
  addr2: ['dist-beat', 'dist-beat-tomorrow', 'dist-tomorrow'], // Madhapur — home distributors only
  addr3: ['qwipo', 'jit-vendor', 'vff', 'sri-mahalakshmi'], // Gachibowli — home wholesalers only
};

export const deliveryLocations = savedAddresses as any[];
const DEFAULT_ADDRESS_ID = (deliveryLocations.find((a) => a.isDefault) || deliveryLocations[0])?.id || 'addr1';

export function vendorIdsFor(addressId?: string): Set<string> {
  const ids = serviceability[addressId || DEFAULT_ADDRESS_ID] || serviceability[DEFAULT_ADDRESS_ID] || [];
  return new Set(ids);
}
export function addressById(addressId?: string) {
  return deliveryLocations.find((a) => a.id === (addressId || DEFAULT_ADDRESS_ID)) || deliveryLocations[0];
}

// Home section mode derived from the serviceable vendor mix at an address —
// both seller types → 'both'; a single type → that section only. Single source
// of truth: the serviceability map above, so lists and sections never disagree.
const sellerTypeById: Record<string, string> = Object.fromEntries((sellers as any[]).map((s) => [s.id, s.type]));
export function availabilityFor(addressId?: string): 'both' | 'distributors' | 'wholesalers' {
  let hasDist = false, hasWhole = false;
  vendorIdsFor(addressId).forEach((id) => {
    if (sellerTypeById[id] === 'distributor') hasDist = true;
    else if (sellerTypeById[id] === 'wholesaler') hasWhole = true;
  });
  if (hasDist === hasWhole) return 'both'; // both types (or, degenerate, neither)
  return hasDist ? 'distributors' : 'wholesalers';
}

// ── React wiring: current delivery address held in App, consumed everywhere ──
type LocationCtx = { addressId: string; setAddressId: (id: string) => void };
export const LocationContext = createContext<LocationCtx>({ addressId: DEFAULT_ADDRESS_ID, setAddressId: () => {} });
export const useLocation = () => useContext(LocationContext);

// Location-filtered collections — mirrors bms's per-location home bootstrap.
export function useAvailable() {
  const { addressId } = useLocation();
  return useMemo(() => {
    const ids = vendorIdsFor(addressId);
    return {
      vendorIds: ids,
      distributors: (homepage.distributors as any[]).filter((d) => ids.has(d.id)),
      sellers: (sellers as any[]).filter((s) => ids.has(s.id)),
      products: (products as any[]).filter((p) => ids.has(p.sellerId)),
    };
  }, [addressId]);
}
