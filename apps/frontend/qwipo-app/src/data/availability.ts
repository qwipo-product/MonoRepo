import { createContext, useContext, useMemo } from 'react';
import { homepage, sellers, products, savedAddresses } from './index';

/* Delivery-location → seller availability. bms fetches serviceable vendors from
   the backend using the address pincode + coordinates; every location can
   return a different set of sellers/distributors/products/delivery options.
   Here that geofencing is modelled as a static address→vendorIds map so the
   mockup shows the same behaviour: change the delivery address and the
   available distributors, wholesalers and their products change with it. */

// Which vendors deliver to each saved address (by address id).
export const serviceability: Record<string, string[]> = {
  addr1: ['dist-beat', 'dist-beat-tomorrow', 'dist-tomorrow', 'qwipo', 'jit-vendor', 'vff', 'sri-mahalakshmi'], // Hitech City — full coverage
  addr2: ['dist-beat', 'dist-tomorrow', 'qwipo', 'jit-vendor'], // Madhapur warehouse — partial
  addr3: ['dist-beat-tomorrow', 'qwipo', 'vff', 'sri-mahalakshmi'], // Gachibowli — different beat + wholesalers
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
