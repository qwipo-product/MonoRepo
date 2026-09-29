import { BatteryFull, Bell, ChevronDown, Home, MapPin, RotateCcw, Search, ShoppingCart, Signal, User, Wifi, X } from 'lucide-react';

import type { PromotionSurface } from '../../types/campaign';

interface PhoneSimulatorProps {
  surface?: PromotionSurface;
  imageUrl?: string;
  emptyLabel?: string;
}

/**
 * Mocks up the real Qwipo DigiDukaan buyer-app home screen (header, distributor toggles, banner
 * carousel, distributor/brand rails, bottom nav) and drops the uploaded creative into whichever
 * slot actually corresponds to the selected surface — the top carousel for `home_carousel`, an
 * inline square card in the "Exclusive offers" grid for `product_list`, or a full-bleed modal
 * over the entire screen for `full_screen`. Each slot keeps the asset's real aspect ratio (see
 * `surfaceDimensions` in `../../lib/promotion-copy`) so an on-spec upload never stretches or crops.
 */
export function PhoneSimulator({ surface, imageUrl, emptyLabel = 'Upload a banner to preview it here' }: PhoneSimulatorProps) {
  const bodySurface = surface === 'product_list' ? 'product_list' : 'home_carousel';

  return (
    <div className="relative mx-auto w-[286px]">
      {/* Side buttons — decorative, they sell the "real device" read. */}
      <span aria-hidden="true" className="absolute top-[104px] -left-[3px] h-8 w-[3px] rounded-l-sm bg-gray-700" />
      <span aria-hidden="true" className="absolute top-[152px] -left-[3px] h-12 w-[3px] rounded-l-sm bg-gray-700" />
      <span aria-hidden="true" className="absolute top-[216px] -left-[3px] h-12 w-[3px] rounded-l-sm bg-gray-700" />
      <span aria-hidden="true" className="absolute top-[178px] -right-[3px] h-16 w-[3px] rounded-r-sm bg-gray-700" />

      {/* Titanium rail + bezel */}
      <div className="rounded-[2.75rem] bg-gradient-to-b from-gray-600 via-gray-800 to-gray-600 p-[3px] shadow-2xl">
        <div className="rounded-[2.6rem] bg-black p-[7px]">
          <div className="relative flex aspect-[9/19.5] w-full flex-col overflow-hidden rounded-[2.15rem] bg-white">
            {/* Dynamic Island */}
            <span
              aria-hidden="true"
              className="absolute top-[9px] left-1/2 z-30 h-[24px] w-[86px] -translate-x-1/2 rounded-full bg-black"
            />

            <StatusBar />
            <AppHeader />

            <div className="flex-1 overflow-y-auto">
              {bodySurface === 'product_list' ? (
                <ProductListBody imageUrl={imageUrl} emptyLabel={emptyLabel} />
              ) : (
                <HomeCarouselBody imageUrl={imageUrl} emptyLabel={emptyLabel} />
              )}
            </div>

            <BottomNav />
            <HomeIndicator />

            {surface === 'full_screen' && <FullScreenOverlay imageUrl={imageUrl} emptyLabel={emptyLabel} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex h-[42px] shrink-0 items-end justify-between bg-white px-5 pb-1.5 text-[11px] font-semibold text-gray-900">
      <span className="tracking-tight">9:41</span>
      <div className="flex items-center gap-1">
        <Signal className="size-3" aria-hidden="true" />
        <Wifi className="size-3" aria-hidden="true" />
        <BatteryFull className="size-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}

/** iOS-style home indicator below the app's bottom nav. */
function HomeIndicator() {
  return (
    <div className="flex shrink-0 items-center justify-center bg-white pt-1 pb-1.5">
      <span aria-hidden="true" className="h-[4px] w-[92px] rounded-full bg-gray-900" />
    </div>
  );
}

function AppHeader() {
  return (
    <div className="shrink-0 space-y-2 border-b border-gray-200 bg-white px-2.5 pt-2 pb-2">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-violet-600 text-[11.5px] font-bold text-white">Q</span>
          <span className="text-[13.5px] font-bold tracking-tight text-gray-900">Qwipo</span>
        </div>
        <div className="text-center leading-tight">
          <p className="text-[8px] font-medium uppercase tracking-wide text-gray-400">Powered by</p>
          <p className="text-[10px] font-bold">
            <span className="text-blue-600">ONDC</span> <span className="text-blue-600 italic">DigiDukaan</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex size-6 items-center justify-center rounded-md bg-gray-100">
            <Bell className="size-3 text-gray-700" aria-hidden="true" />
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-red-500" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-md bg-gray-100">
            <User className="size-3 text-gray-700" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">
        <MapPin className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">Deliver to Kukatpally, Hyderabad...</span>
        <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1.5 text-[10px] text-gray-400">
        <Search className="size-3 shrink-0" aria-hidden="true" />
        <span>Search for Products</span>
      </div>
    </div>
  );
}

function ToggleCards() {
  return (
    <div className="grid grid-cols-2 gap-1.5 px-2.5 pt-2.5">
      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1">
        <span className="size-6 shrink-0 rounded bg-gray-100" />
        <span className="text-[9px] leading-tight font-semibold text-gray-700">Authorised Distributors</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-primary p-1">
        <span className="size-6 shrink-0 rounded bg-white/20" />
        <span className="text-[9px] leading-tight font-semibold text-white">Wholesalers</span>
      </div>
    </div>
  );
}

function CarouselSlot({ imageUrl, emptyLabel }: { imageUrl?: string; emptyLabel: string }) {
  return (
    <div className="mt-2.5 px-2.5">
      <div className="overflow-hidden rounded-lg">
        {imageUrl ? (
          <img src={imageUrl} alt="Promotion banner preview" className="aspect-[1080/450] w-full object-contain" />
        ) : (
          <div className="flex aspect-[1080/450] w-full items-center justify-center bg-gray-100 px-3 text-center text-[10px] text-gray-500">
            {emptyLabel}
          </div>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className={`size-1 rounded-full ${index === 1 ? 'bg-gray-700' : 'bg-gray-300'}`} />
        ))}
      </div>
    </div>
  );
}

function DistributorsSection() {
  return (
    <div className="mt-3 px-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-gray-900">Distributors</span>
        <span className="text-[9px] font-medium text-primary">See All</span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-md border border-gray-200 p-1 text-center">
            <span className="mx-auto block size-6 rounded bg-gray-100" />
            <span className="mt-1 block truncate text-[8.5px] font-medium text-gray-700">Brand {index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllBrandsSection() {
  return (
    <div className="mt-3 px-2.5 pb-3">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-gray-900">All Brands</span>
        <span className="text-[9px] font-medium text-primary">See All</span>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} className="size-7 shrink-0 rounded-full bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function HomeCarouselBody({ imageUrl, emptyLabel }: { imageUrl?: string; emptyLabel: string }) {
  return (
    <div className="bg-white pb-1">
      <ToggleCards />
      <CarouselSlot imageUrl={imageUrl} emptyLabel={emptyLabel} />
      <DistributorsSection />
      <AllBrandsSection />
    </div>
  );
}

function ProductListBody({ imageUrl, emptyLabel }: { imageUrl?: string; emptyLabel: string }) {
  return (
    <div className="bg-white px-2.5 pt-2.5 pb-3">
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-teal-100 text-[10px] font-semibold text-teal-800">Groceries</div>
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-orange-100 text-[10px] font-semibold text-orange-800">FMCG</div>
      </div>

      <p className="mt-3 text-[11.5px] font-semibold text-gray-900">Exclusive offers</p>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <div className="aspect-square rounded-md bg-gray-100" />
        <div className="overflow-hidden rounded-md ring-1 ring-primary/50">
          {imageUrl ? (
            <img src={imageUrl} alt="Promotion banner preview" className="aspect-square w-full object-contain" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-gray-100 px-1 text-center text-[8.5px] text-gray-500">
              {emptyLabel}
            </div>
          )}
        </div>
        <div className="aspect-square rounded-md bg-gray-100" />
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="flex shrink-0 items-center justify-around border-t border-gray-200 bg-white py-1.5">
      <div className="flex flex-col items-center gap-0.5 text-primary">
        <Home className="size-3.5" aria-hidden="true" />
        <span className="text-[9px] font-semibold">Home</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 text-gray-400">
        <RotateCcw className="size-3.5" aria-hidden="true" />
        <span className="text-[9px] font-medium">Reorder</span>
      </div>
      <div className="relative flex flex-col items-center gap-0.5 text-gray-400">
        <ShoppingCart className="size-3.5" aria-hidden="true" />
        <span className="absolute -top-1 -right-1.5 flex size-2.5 items-center justify-center rounded-full bg-red-500 text-[6.5px] font-bold text-white">
          6
        </span>
        <span className="text-[9px] font-medium">Cart</span>
      </div>
    </div>
  );
}

function FullScreenOverlay({ imageUrl, emptyLabel }: { imageUrl?: string; emptyLabel: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      {imageUrl ? (
        <img src={imageUrl} alt="Promotion banner preview" className="aspect-[1080/1920] h-full w-full object-cover" />
      ) : (
        <div className="flex aspect-[1080/1920] h-full items-center justify-center bg-gray-900 px-6 text-center text-[11.5px] text-gray-300">
          {emptyLabel}
        </div>
      )}
      <span
        className="absolute top-3 right-3 z-10 flex size-6 items-center justify-center rounded-full bg-black/50 text-white"
        aria-hidden="true"
      >
        <X className="size-3.5" />
      </span>
    </div>
  );
}
