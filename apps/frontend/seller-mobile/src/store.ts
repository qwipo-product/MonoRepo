import { useState } from 'react';
import { sellerCustomers } from '@mockups/mock-data';

/* The seller's store settings for this demo session — the portal's Store
   Settings page: taking orders or paused, working hours, weekly off and
   holidays. */

export interface StoreSettings {
  acceptingOrders: boolean;
  opensAt: string; // HH:MM
  closesAt: string;
  weeklyOff: string[]; // 'Sunday', …
  holidays: { name: string; date: string }[]; // ISO date
}

export const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Days a beat delivers on — they can't be a weekly off. */
export const BEAT_DAYS: string[] = WEEK.filter((d) =>
  sellerCustomers.some((c) => c.addresses.some((a) => a.serviceability.some((s) => s.days.includes(d))))
);

export function useStoreSettings() {
  const [store, setStore] = useState<StoreSettings>({
    acceptingOrders: true,
    opensAt: '09:00',
    closesAt: '21:00',
    weeklyOff: ['Sunday'],
    holidays: [
      { name: 'Diwali', date: '2026-11-08' },
      { name: 'Christmas', date: '2026-12-25' },
    ],
  });
  return { store, setStore };
}
