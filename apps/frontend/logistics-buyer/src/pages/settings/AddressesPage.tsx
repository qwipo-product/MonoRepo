// /settings/addresses (spec 07 §7): the Warehouse Locations module alone. Reached by URL or from Create Single Order's
// "Go to Settings" action; no tab highlights for this route (as-built).
import { useState } from 'react';
import { authService } from '../../api/services/auth.service';
import { AddWarehouseLocationModal, LocationsList, useWarehouseLocations } from './modules/WarehouseLocationsModule';
import './modules/settings-modules.css';
import './AddressesPage.css';

export default function AddressesPage() {
  const [buyerId] = useState(() => authService.getCurrentUser()?.id || '');
  const warehouses = useWarehouseLocations(buyerId);

  return (
    <div className="addresses-page st-scope">
      <section className="settings-section warehouse-locations">
        <div className="section-header-with-action">
          <h2 className="warehouse-title">Warehouse Locations</h2>
          <button className="add-address-btn" onClick={() => warehouses.openAddAddressModal()}>
            <i className="fas fa-plus" /> Add Address
          </button>
        </div>
        <LocationsList c={warehouses} />
      </section>
      {warehouses.showAddAddressModal && <AddWarehouseLocationModal c={warehouses} />}
    </div>
  );
}
