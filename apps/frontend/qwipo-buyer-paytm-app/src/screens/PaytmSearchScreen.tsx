import { ArrowLeft, X, Headphones, Flame, Landmark } from 'lucide-react';

/* Simplified mock of Paytm's search (query "qwipo" → the Qwipo mini app result).
   Tapping the Qwipo result → Qwipo Welcome. */
export function PaytmSearchScreen({ onBack, onOpenQwipo }: { onBack: () => void; onOpenQwipo: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[#eef1f6]">
      {/* search bar */}
      <div className="p-3">
        <div className="flex h-11 items-center gap-3 rounded-full bg-white px-3 shadow-sm">
          <button onClick={onBack} aria-label="Back" className="text-[#002970]">
            <ArrowLeft size={20} />
          </button>
          <span className="flex-1 text-sm text-[#002970]">qwipo</span>
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gray-300 text-white">
            <X size={12} />
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
        {/* Mini Apps result */}
        <div className="rounded-2xl bg-white p-4">
          <div className="text-lg font-bold text-[#002970]">Mini Apps</div>
          <button onClick={onOpenQwipo} className="mt-3 flex w-16 flex-col items-center gap-1 active:opacity-80">
            <span className="h-12 w-12 overflow-hidden rounded-full">
              <img src="/brand/qwipo-primary.svg" alt="Qwipo" className="h-12 w-12 object-cover object-top" />
            </span>
            <span className="text-[10px] font-medium italic text-[#0a5cff]">DigiDukaan</span>
            <span className="text-sm text-gray-800">Qwipo</span>
          </button>
        </div>

        {/* Popular services (static) */}
        <div className="rounded-2xl bg-white p-4">
          <div className="text-lg font-bold text-[#002970]">Popular Services</div>
          <div className="mt-3 flex justify-between">
            <Svc label="Get Soundbox" icon={<Flame size={18} />} />
            <Svc label="Support" icon={<Headphones size={18} />} />
            <Svc label="Book Gas" icon={<Flame size={18} />} />
            <Svc label="Settlement" icon={<Landmark size={18} />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Svc({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex w-16 flex-col items-center gap-1 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef4ff] text-[#0a5cff]">{icon}</span>
      <span className="text-[10px] leading-tight text-gray-700">{label}</span>
    </div>
  );
}
