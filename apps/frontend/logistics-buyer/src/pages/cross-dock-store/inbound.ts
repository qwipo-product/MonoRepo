import type { InboundState } from '../../types/crossDock';

/** A Service Centre truck at this store, by state (LBNP status-badge classes). */
export const INBOUND_STATUS: Record<InboundState, { label: string; cls: string }> = {
  SCHEDULED: { label: 'Scheduled', cls: 'planned' },
  ON_THE_WAY: { label: 'On the way', cls: 'in-progress' },
  AT_STORE: { label: 'GRN pending', cls: 'in-progress' },
  GRN_DONE: { label: 'Awaiting OTP', cls: 'in-progress' },
  RECEIVED: { label: 'Received', cls: 'completed' },
};
