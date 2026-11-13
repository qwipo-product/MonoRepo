// /settings/store (spec 07 §6): the Store Timings module alone. No tab highlights for this route (as-built).
import { useState } from 'react';
import { authService } from '../../api/services/auth.service';
import { StoreTimingsView, useStoreTimings } from './modules/StoreTimingsModule';
import './modules/settings-modules.css';
import './StoreSettingsPage.css';

export default function StoreSettingsPage() {
  const [buyerId] = useState(() => {
    const user = authService.getCurrentUser();
    console.log('Current user:', user);
    return user ? user.id : '';
  });
  const timings = useStoreTimings(buyerId);

  return (
    <div className="store-settings-page st-scope">
      <section className="settings-section">
        <div className="section-header">
          <h2>Store Timings</h2>
          <p>Configure your business operating hours and non-operating days</p>
        </div>
        <StoreTimingsView c={timings} variant="store" />
      </section>
    </div>
  );
}
