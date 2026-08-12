import { RotateCcw, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@mockups/ui';

/* Which device frame the mockup renders in. Sizes are CSS viewport points
   (portrait), matching Chrome DevTools' device list, so what you see here is
   what that device's browser/WebView reports. Review-only. */
export type DeviceKind = 'phone' | 'foldable' | 'tablet';
export type Orientation = 'portrait' | 'landscape';

export type Device = {
  id: string;
  label: string;
  w: number; // portrait width, CSS pt
  h: number; // portrait height, CSS pt
  kind: DeviceKind;
  radius: number; // frame corner radius, px
};

const phone = (id: string, label: string, w: number, h: number, radius = 38): Device => ({
  id, label, w, h, kind: 'phone', radius,
});
const fold = (id: string, label: string, w: number, h: number): Device => ({
  id, label, w, h, kind: 'foldable', radius: 26,
});
const tablet = (id: string, label: string, w: number, h: number): Device => ({
  id, label, w, h, kind: 'tablet', radius: 26,
});

export const DEVICES: Device[] = [
  // Phones — small → large
  phone('android-small', 'Android Small', 360, 640, 24),
  phone('galaxy-s8', 'Galaxy S8+', 360, 740, 30),
  phone('iphone-se', 'iPhone SE', 375, 667, 24),
  phone('iphone-12-mini', 'iPhone 12 / 13 mini', 375, 812),
  phone('galaxy-s24-ultra', 'Galaxy S23 / S24 Ultra', 384, 824, 32),
  phone('iphone-14', 'iPhone 12–14 / 16e', 390, 844),
  phone('iphone-15-16', 'iPhone 15 / 16', 393, 852),
  phone('iphone-16-pro', 'iPhone 16 Pro / 17 / 17 Pro', 402, 874),
  phone('galaxy-a51', 'Galaxy A51 / 71', 412, 914, 32),
  phone('android-medium', 'Android Medium', 412, 915, 32),
  phone('pixel-8', 'Pixel 7 / 8 / 9', 412, 915, 32),
  phone('galaxy-s20-ultra', 'Galaxy S20 Ultra', 412, 915, 32),
  phone('iphone-xr', 'iPhone XR / 11', 414, 896),
  phone('iphone-air', 'iPhone Air', 420, 912),
  phone('iphone-15-pro-max', 'iPhone 15 Pro Max / 16 Plus', 430, 932),
  phone('iphone-17-pro-max', 'iPhone 16 / 17 Pro Max', 440, 956),
  phone('android-large', 'Android Large (Pixel Pro XL)', 448, 998, 32),
  // Foldables
  fold('z-fold-cover', 'Galaxy Z Fold (cover)', 344, 882),
  fold('surface-duo', 'Surface Duo', 540, 720),
  fold('pixel-fold-open', 'Pixel Fold (open)', 673, 841),
  fold('z-fold-open', 'Galaxy Z Fold (open)', 690, 829),
  // Tablets — small → large
  tablet('ipad-mini', 'iPad Mini', 768, 1024),
  tablet('galaxy-tab', 'Galaxy Tab / Android Tablet', 800, 1280),
  tablet('ipad-air', 'iPad Air / iPad 10.9"', 820, 1180),
  tablet('ipad-pro-11', 'iPad Pro 11"', 834, 1194),
  tablet('android-expanded', 'Android Expanded (Material)', 840, 1280),
  tablet('surface-pro', 'Surface Pro 7', 912, 1368),
  tablet('ipad-pro-13', 'iPad Pro 12.9" / 13"', 1024, 1366),
];

export const DEFAULT_DEVICE_ID = 'iphone-14';

export const deviceById = (id: string | null): Device =>
  DEVICES.find((d) => d.id === id) ?? DEVICES.find((d) => d.id === DEFAULT_DEVICE_ID)!;

/* Effective frame size for a device + orientation. */
export const frameSize = (d: Device, o: Orientation) =>
  o === 'portrait' ? { w: d.w, h: d.h } : { w: d.h, h: d.w };

const KIND_LABEL: Record<DeviceKind, string> = {
  phone: 'Phones',
  foldable: 'Foldables',
  tablet: 'Tablets',
};

export function DeviceSwitcher({
  device,
  orientation,
  scale,
  onDeviceChange,
  onOrientationChange,
}: {
  device: Device;
  orientation: Orientation;
  scale: number;
  onDeviceChange: (d: Device) => void;
  onOrientationChange: (o: Orientation) => void;
}) {
  const { w, h } = frameSize(device, orientation);
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground-secondary">
          {device.kind === 'tablet' ? <Tablet size={16} /> : <Smartphone size={16} />}
        </span>
        <select
          value={device.id}
          onChange={(e) => onDeviceChange(deviceById(e.target.value))}
          aria-label="Device"
          className="h-9 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground outline-none hover:bg-muted"
        >
          {(['phone', 'foldable', 'tablet'] as const).map((kind) => (
            <optgroup key={kind} label={KIND_LABEL[kind]}>
              {DEVICES.filter((d) => d.kind === kind).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {d.w}×{d.h}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => onOrientationChange(orientation === 'portrait' ? 'landscape' : 'portrait')}
          aria-label="Rotate device"
          title={orientation === 'portrait' ? 'Rotate to landscape' : 'Rotate to portrait'}
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground hover:bg-muted',
            orientation === 'landscape' && 'border-primary bg-primary-soft text-primary'
          )}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="mt-1 px-1 text-[11px] tabular-nums text-foreground-secondary">
        {w} × {h} pt · {orientation}
        {scale < 1 ? ` · fitted to ${Math.round(scale * 100)}%` : ''}
      </div>
    </div>
  );
}
