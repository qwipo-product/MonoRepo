import { Search, Bell, Menu, MapPin, ChevronRight, QrCode, Landmark, Headphones, IndianRupee, Store } from 'lucide-react';

/* Simplified mock of the Paytm for Business launcher (the super-app home). Not
   pixel-perfect Paytm — just enough context to reach the Qwipo mini app. Tapping
   Search → Paytm Search; tapping the Qwipo mini app → Qwipo Welcome. */
export function PaytmLauncherScreen({ onSearch, onOpenQwipo }: { onSearch: () => void; onOpenQwipo: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[#eef1f6]">
      {/* Paytm header */}
      <div className="bg-white px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <Menu size={20} className="text-[#002970]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-sm font-bold text-[#002970]">
              <span className="truncate">Akshith</span>
              <ChevronRight size={14} />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <MapPin size={11} /> <span className="truncate">Shop: Near Taaza restaurant, Hyderabad</span>
            </div>
          </div>
          <button onClick={onSearch} aria-label="Search" className="text-[#002970]">
            <Search size={20} />
          </button>
          <Bell size={20} className="text-[#002970]" />
        </div>
        <span className="mt-1 inline-block rounded bg-[#eef1f6] px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
          Business Owner
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {/* loan promo */}
        <div className="rounded-2xl bg-gradient-to-r from-[#c8f0e8] to-[#d7eafe] p-4">
          <div className="text-xs font-semibold text-[#002970]">₹ Merchant Loan</div>
          <div className="mt-1 text-lg font-bold text-[#002970]">₹75,000 loan approved for your Business</div>
          <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0a5cff]">
            Proceed <ChevronRight size={14} />
          </div>
        </div>

        {/* Mini Apps */}
        <div className="rounded-2xl bg-white p-4">
          <div className="text-base font-bold text-[#002970]">Mini Apps</div>
          <div className="mt-3 flex gap-5">
            <MiniApp label="Qwipo" onClick={onOpenQwipo} highlight />
            <MiniApp label="KYC" icon={<QrCode size={20} />} />
            <MiniApp label="Loan" icon={<Landmark size={20} />} />
            <MiniApp label="Support" icon={<Headphones size={20} />} />
          </div>
        </div>

        {/* Accept payments (static) */}
        <div className="rounded-2xl bg-white p-4">
          <div className="text-base font-bold text-[#002970]">Accept Payments</div>
          <div className="mt-3 flex justify-between">
            <Tile label="Get Soundbox" icon={<Store size={18} />} />
            <Tile label="Show My QR" icon={<QrCode size={18} />} />
            <Tile label="Settlement" icon={<Landmark size={18} />} />
            <Tile label="Payments" icon={<IndianRupee size={18} />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniApp({ label, icon, onClick, highlight }: { label: string; icon?: React.ReactNode; onClick?: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-14 flex-col items-center gap-1 active:opacity-80">
      {highlight ? (
        <span className="h-12 w-12 overflow-hidden rounded-full">
          <img src="/brand/qwipo-primary.svg" alt="Qwipo" className="h-12 w-12 object-cover object-top" />
        </span>
      ) : (
        <span className="grid h-12 w-12 place-items-center rounded-full border border-gray-200 text-[#002970]">
          {icon}
        </span>
      )}
      <span className="text-[11px] text-gray-700">{label}</span>
    </button>
  );
}

function Tile({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex w-16 flex-col items-center gap-1 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef4ff] text-[#0a5cff]">{icon}</span>
      <span className="text-[10px] leading-tight text-gray-700">{label}</span>
    </div>
  );
}
