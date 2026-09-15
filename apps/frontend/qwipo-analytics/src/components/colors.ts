// Chart colours that are not covered by a semantic token.

export const statusColor: Record<string, string> = {
  created: 'var(--neutral)', accepted: 'var(--primary)', packed: '#4f46e5', shipped: '#0891b2',
  delivered: 'var(--success)', cancelled: 'var(--error)', returned: 'var(--warning)',
};

export const ageColor = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', 'var(--error)'];
