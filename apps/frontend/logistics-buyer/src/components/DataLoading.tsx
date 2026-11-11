import { useMemo } from 'react';
import './DataLoading.css';

const TIPS = [
  'Getting your data ready...',
  'Almost there...',
  'Preparing your information...',
  'Loading your orders...',
  'Just a moment longer...',
];

interface Props {
  message?: string;
  overlay?: boolean;
  showTip?: boolean;
}

/** Port of <app-data-loading>: spinner + message, optional random tip, optional overlay mode. */
export default function DataLoading({ message = 'Loading data...', overlay = false, showTip = false }: Props) {
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);
  return (
    <div className={`data-loading-container${overlay ? ' overlay' : ''}`}>
      <div className="loading-content">
        <div className="spinner"><div className="spinner-circle" /></div>
        <div className="loading-text">
          <p>{message || 'Loading data...'}</p>
          {showTip && <small>{tip}</small>}
        </div>
      </div>
    </div>
  );
}
