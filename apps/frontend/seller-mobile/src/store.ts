import { useState } from 'react';
import { sellerCustomers } from '@mockups/mock-data';

/* The seller's settings for this demo session — the portal's Store
   Settings (taking orders or paused, working hours, weekly off, holidays),
   Order Settings (order value limits, processing, returns) and
   Communication (WhatsApp + notifications). */

export interface StoreSettings {
  acceptingOrders: boolean;
  opensAt: string; // HH:MM
  closesAt: string;
  weeklyOff: string[]; // 'Sunday', …
  holidays: { name: string; date: string }[]; // ISO date
  // Order Settings
  minOrderValue: number; // ₹
  maxOrderValue: number; // ₹
  nonBeatMov: number; // ₹ — 0 turns off Tomorrow Delivery
  processingTime: string; // one of PROCESSING_TIMES
  cancellationWindow: string; // one of CANCELLATION_WINDOWS
  allowReturns: boolean;
  returnWindow: string; // one of RETURN_WINDOWS
  returnType: string;
  // Communication
  whatsappNumber: string;
  whatsappConnected: boolean;
  notifyNewOrder: boolean;
}

// The portal's fixed choices (settings/order/order-settings.component.ts).
export const PROCESSING_TIMES = ['6 hours', '12 hours', '24 hours', '48 hours', '72 hours'];
export const CANCELLATION_WINDOWS = ['1 hour', '2 hours', '4 hours', '6 hours', '12 hours', '24 hours'];
export const RETURN_WINDOWS = ['24 hours', '48 hours'];

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
    minOrderValue: 500,
    maxOrderValue: 200000,
    nonBeatMov: 1500,
    processingTime: '24 hours',
    cancellationWindow: '2 hours',
    allowReturns: true,
    returnWindow: '24 hours',
    returnType: 'Full Order Return Only',
    whatsappNumber: '',
    whatsappConnected: false,
    notifyNewOrder: true,
  });
  return { store, setStore };
}
