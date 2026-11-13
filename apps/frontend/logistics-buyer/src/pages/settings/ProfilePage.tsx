// Profile (/settings/profile, spec 07 §5): read-only Business Details + Store Timings module + Warehouse Locations module.
// Plain component: no permission checks (anyone who can open /settings can edit timings and addresses).
import { useEffect, useState } from 'react';
import { authService } from '../../api/services/auth.service';
import { buyerService } from '../../api/services/buyer.service';
import { StoreTimingsView, useStoreTimings } from './modules/StoreTimingsModule';
import { AddWarehouseLocationModal, LocationsList, useWarehouseLocations } from './modules/WarehouseLocationsModule';
import './modules/settings-modules.css';
import './ProfilePage.css';

interface BuyerProfile {
  name?: string;
  email?: string;
  businessName?: string;
  mobileNumber?: string;
  [k: string]: unknown;
}

export default function ProfilePage() {
  const [buyerId] = useState(() => authService.getCurrentUser()?.id || '');
  const [buyer, setBuyer] = useState<BuyerProfile>({});
  const timings = useStoreTimings(buyerId);
  const warehouses = useWarehouseLocations(buyerId);

  // loadProfileData() — fires even when buyerId is "" (→ /buyer/?type=Id)
  useEffect(() => {
    (async () => {
      try {
        const data = await buyerService.getBuyerById(buyerId);
        if (data) setBuyer(data);
      } catch (e) {
        console.error('Error loading profile data:', e);
      }
    })();
  }, [buyerId]);

  return (
    <div className="profile-page st-scope">
      <section className="profile-grid">
        <section className="settings-section profile-settings-section">
          <div className="section-header">
            <h2>Business Details</h2>
            <p>Manage your personal and business information</p>
          </div>
          <div className="profile-content">
            <div className="profile-field">
              <label>Name</label>
              <div className="profile-value">
                <span className="profile-data">{buyer.name || 'Not provided'}</span>
              </div>
            </div>
            <div className="profile-field">
              <label>Email Address</label>
              <div className="profile-value">
                <span className="profile-data">{buyer.email || 'Not provided'}</span>
              </div>
            </div>
            <div className="profile-field">
              <label>Business Name</label>
              <div className="profile-value">
                <span className="profile-data">{buyer.businessName || 'Not provided'}</span>
              </div>
            </div>
            <div className="profile-field">
              <label>Phone Number</label>
              <div className="profile-value">
                <span className="profile-data">{buyer.mobileNumber || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section store-timings">
          <div className="section-header">
            <h2>Store Timings</h2>
            <p>Configure your business operating hours and non-operating days</p>
          </div>
          <StoreTimingsView c={timings} variant="profile" />
        </section>

        <section className="settings-section warehouse-locations">
          <div className="section-header-with-action">
            <div className="section-header">
              <h2>Warehouse Locations</h2>
              <p>Manage your warehouse and pickup addresses</p>
            </div>
            <button className="add-address-btn" onClick={() => warehouses.openAddAddressModal()}>
              <i className="fas fa-plus" /> Add Address{' '}
            </button>
          </div>
          <LocationsList c={warehouses} />
        </section>
        {warehouses.showAddAddressModal && <AddWarehouseLocationModal c={warehouses} />}
      </section>
    </div>
  );
}
