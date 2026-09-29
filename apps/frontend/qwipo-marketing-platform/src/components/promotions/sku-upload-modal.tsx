import { useMemo, useState } from 'react';
import { Download, Upload } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@mockups/web-ui';

import { skus } from '../../lib/mock-data';

export interface SkuOrderRow {
  skuId: string;
  skuName: string | null;
}

/** Presentational Display Order / SKU ID / SKU Name table — row index+1 is the displayed order.
 * Reused by the upload modal's preview and by both read-only "view SKUs" viewers. A row with
 * `skuName === null` only ever occurs in the upload preview (an id the mock catalog doesn't
 * recognize) — the read-only viewers always hold already-validated ids. */
export function SkuOrderTable({ rows }: { rows: SkuOrderRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No SKUs to show.
      </p>
    );
  }

  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-gray-50 text-xs font-medium tracking-wide text-gray-500 uppercase">
          <tr>
            <th className="w-28 px-3 py-2">Display order</th>
            <th className="px-3 py-2">SKU ID</th>
            <th className="px-3 py-2">SKU name</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((row, index) => (
            <tr key={`${row.skuId}-${index}`} className={row.skuName === null ? 'bg-red-50' : undefined}>
              <td className="px-3 py-2 text-gray-500">{index + 1}</td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700">{row.skuId}</td>
              <td className={`px-3 py-2 ${row.skuName === null ? 'font-medium text-red-600' : 'text-gray-900'}`}>
                {row.skuName ?? 'Unknown SKU ID'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Resolves already-committed `sku_ids` (array order = display order) against the mock catalog
 * for the read-only viewers — simulates what `GET /api/v1/skus/batch-lookup` would return, since
 * this app has no real backend anywhere (Zustand + localStorage only, confirmed all session). */
export function resolveSkuRows(skuIds: string[]): SkuOrderRow[] {
  return skuIds.map((skuId) => ({ skuId, skuName: skus.find((sku) => sku.id === skuId)?.name ?? null }));
}

function downloadCsvTemplate() {
  const csv = 'sku_id,display_order\nsku-atta-5kg,1\nsku-atta-10kg,2\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sku-upload-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ParsedRow {
  sku_id: string;
  display_order: number;
}

/** Minimal, dependency-free CSV parser (no quoted-comma support — the template is a plain
 * two-column id/number sheet, which never needs it). `.xlsx` is intentionally not supported:
 * the only npm-published parser (`xlsx`) has two unpatched high-severity CVEs (prototype
 * pollution, ReDoS) with no fix available, and this parses untrusted admin-uploaded files. */
function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const [, ...dataLines] = lines; // skip the header row
  return dataLines
    .map((line): ParsedRow | null => {
      const [skuId, displayOrderRaw] = line.split(',').map((cell) => cell.trim());
      const displayOrder = Number(displayOrderRaw);
      if (!skuId || !Number.isFinite(displayOrder)) return null;
      return { sku_id: skuId, display_order: displayOrder };
    })
    .filter((row): row is ParsedRow => row !== null);
}

interface SkuUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ordered, already-validated ids (unmatched rows excluded) — a dangling id would break every
   * other lookup that reads `product.sku_ids` elsewhere in the app. */
  onConfirm: (skuIds: string[]) => void;
}

export function SkuUploadModal({ open, onOpenChange, onConfirm }: SkuUploadModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const hydratedRows = useMemo(
    () =>
      [...parsedRows]
        .sort((a, b) => a.display_order - b.display_order)
        .map((row) => ({ skuId: row.sku_id, skuName: skus.find((sku) => sku.id === row.sku_id)?.name ?? null })),
    [parsedRows],
  );
  const unmatchedCount = hydratedRows.filter((row) => row.skuName === null).length;

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Only .csv files are supported.');
      return;
    }
    setParseError(null);
    setFileName(file.name);
    file.text().then((text) => {
      const rows = parseCsv(text);
      if (rows.length === 0) setParseError('No valid rows found — check the sku_id and display_order columns.');
      setParsedRows(rows);
    });
  };

  const reset = () => {
    setFileName(null);
    setParsedRows([]);
    setParseError(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleDone = () => {
    onConfirm(hydratedRows.filter((row) => row.skuName !== null).map((row) => row.skuId));
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload SKUs</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">CSV template</p>
              <p className="text-xs text-gray-500">Columns: sku_id, display_order.</p>
            </div>
            <Button type="button" variant="outline" onClick={downloadCsvTemplate}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download template
            </Button>
          </div>

          <label
            htmlFor="sku-upload-input"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-center transition-colors hover:border-primary"
          >
            <Upload className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-600">{fileName ?? 'Click or drop a .csv file'}</span>
            <input
              id="sku-upload-input"
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = '';
              }}
            />
          </label>

          {parseError && <p className="text-xs font-medium text-red-600">{parseError}</p>}

          {hydratedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Preview ({hydratedRows.length} rows)</p>
                {unmatchedCount > 0 && <p className="text-xs font-medium text-red-600">{unmatchedCount} unmatched — excluded on Done</p>}
              </div>
              <SkuOrderTable rows={hydratedRows} />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleDone} disabled={hydratedRows.length === 0}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SkuViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuIds: string[];
  title?: string;
}

/** Read-only viewer shared by Step 1's "View SKUs" and the campaign list's "View uploaded
 * SKUs" — both just hand it a `sku_ids` array and get the same table back. */
export function SkuViewModal({ open, onOpenChange, skuIds, title = 'Uploaded SKUs' }: SkuViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SkuOrderTable rows={resolveSkuRows(skuIds)} />
      </DialogContent>
    </Dialog>
  );
}
