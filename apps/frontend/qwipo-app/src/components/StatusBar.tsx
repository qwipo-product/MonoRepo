import { Signal, Wifi, BatteryFull } from 'lucide-react';

/* Mock iOS status bar for the phone frame. Chromeless auth screens render it
   themselves; shell-wrapped screens get it from the shell. */
export default function StatusBar() {
  return (
    <div className="flex-shrink-0 h-8 flex items-center justify-between px-5 text-xs font-medium text-foreground">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </div>
    </div>
  );
}
