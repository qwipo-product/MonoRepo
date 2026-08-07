import { useState } from 'react';
import { Icon, StatusBar } from '../../components/Icons';
import { savedAddresses as initialAddresses } from '../../data/mockData';
import AddAddressSheet from '../../components/AddAddressSheet';

export default function AddressesScreen({ onBack }: any) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addOpen, setAddOpen] = useState(false);

  const setDefault = (id: string) => {
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
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
              role="button"
              tabIndex={0}
              aria-pressed={a.isDefault}
              aria-label={`Deliver to ${a.line1}, ${a.city} ${a.pincode}`}
              className={`addr-stop ${a.isDefault ? 'is-default' : ''}`}
              style={{ animationDelay: `${120 + i * 70}ms` }}
              onClick={() => setDefault(a.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDefault(a.id);
                }
              }}
            >
              {/* Route rail — the connecting line + this stop's marker */}
              <div className="addr-rail" aria-hidden="true">
                <span className="addr-pin">
                  {a.isDefault ? <Icon.Check /> : <span className="addr-pin-dot" />}
                </span>
              </div>

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
                    <span className="addr-set-hint">Tap to deliver here</span>
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
    </>
  );
}
