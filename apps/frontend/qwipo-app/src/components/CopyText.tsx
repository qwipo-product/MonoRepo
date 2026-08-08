import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/* Copy-to-clipboard text pill. Shows a tick for ~1.2s after copying. */
export default function CopyText({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <button onClick={copy} className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`} aria-label={`Copy ${value}`}>
      {value}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}
