import { useState } from 'react';
import { Icon, StatusBar } from '../../components/Icons';
import { savedAddresses as initialAddresses } from '@mockups/mock-data';
import AddAddressSheet from '../../components/AddAddressSheet';

export default function AddressesScreen({ onBack, onSaved }: any) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState('');

  const setDefault = (id: string) => {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    setToast('Address updated successfully');
    // Let the success popup show, then land on Home.
    setTimeout(() => onSaved?.(), 1100);
  };

  const handleSave = (next: any) => {
    setAddresses((prev) => [
      {
        ...next,
        id: `addr${prev.length + 1}`,
        isDefault: prev.length === 0,
      },
      ...prev,
    ]);
    setAddOpen(false);
  };

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Saved addresses</h1>
            <p>{addresses.length} delivery locations</p>
          </div>
        </div>

        <div className="addr-route">
          {/* Add new address — the origin point of the route */}
          <button className="addr-add" onClick={() => setAddOpen(true)}>
            <span className="addr-add-node">
              <Icon.Plus />
            </span>
            <span className="addr-add-text">
              <strong>Add new address</strong>
              <small>Save a new delivery location</small>
            </span>
            <span className="addr-add-chev">
              <Icon.ChevronRight />
            </span>
          </button>

          {addresses.map((a, i) => (
            <div
              key={a.id}
              className={`addr-stop ${a.isDefault ? 'is-default' : ''}`}
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <div className="addr-card">
                <div className="addr-card-head">
                  <span className="addr-emoji">{a.icon}</span>
                  <div className="addr-lines">
                    <span className="addr-line-primary">{a.line1}</span>
                    <span className="addr-line-sub">
                      {a.line2}, {a.city}, {a.state}
                    </span>
                  </div>
                </div>

                <div className="addr-card-foot">
                  <span className="addr-pincode">
                    <Icon.MapPin />
                    {a.pincode}
                  </span>
                  {a.isDefault ? (
                    <span className="addr-deliver-badge">
                      <Icon.Truck />
                      Delivering here
                    </span>
                  ) : (
                    <button className="addr-set-btn" onClick={() => setDefault(a.id)}>
                      Set as default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {addOpen && (
        <AddAddressSheet onClose={() => setAddOpen(false)} onSave={handleSave} />
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon.Check /> {toast}
        </div>
      )}
    </>
  );
}
