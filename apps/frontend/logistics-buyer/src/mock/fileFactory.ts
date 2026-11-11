// Helpers for mock endpoints that return files (PDF loading sheets, XLSX reports, CSV).
import * as XLSX from 'xlsx';

/**
 * Builds a small valid PDF (Helvetica, A4 portrait, auto page breaks) from a title and text lines.
 * Good enough for loading sheets / indents / order-detail PDFs in the replica.
 */
export function makePdf(title: string, lines: string[]): Blob {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7e]/g, (c) => (c === '₹' ? 'Rs.' : '?'));
  const perPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < Math.max(1, lines.length); i += perPage) pages.push(lines.slice(i, i + perPage));

  const objects: string[] = [];
  const add = (s: string) => {
    objects.push(s);
    return objects.length;
  };
  const catalogId = add(''); // placeholder
  const pagesId = add(''); // placeholder
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds: number[] = [];
  pages.forEach((pl, pi) => {
    let content = 'BT\n';
    content += `/F2 14 Tf 40 800 Td (${esc(title)}) Tj\n`;
    content += `/F1 8 Tf 0 -14 Td (${esc(`Generated ${new Date().toLocaleString('en-IN')} - page ${pi + 1}/${pages.length}`)}) Tj\n`;
    content += '/F1 9 Tf 0 -20 Td\n';
    pl.forEach((l) => (content += `(${esc(l).slice(0, 110)}) Tj 0 -15 Td\n`));
    content += 'ET';
    const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentId} 0 R >>`));
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (out += `${String(o).padStart(10, '0')} 00000 n \n`));
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}

/** Builds an .xlsx Blob from sheets of row objects (keys become headers). */
export function makeXlsx(sheets: { name: string; rows: Record<string, unknown>[] | unknown[][] }[]): Blob {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = Array.isArray(s.rows[0]) ? XLSX.utils.aoa_to_sheet(s.rows as unknown[][]) : XLSX.utils.json_to_sheet(s.rows as Record<string, unknown>[]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function makeCsv(rows: Record<string, unknown>[]): Blob {
  if (!rows.length) return new Blob([''], { type: 'text/csv' });
  const headers = Object.keys(rows[0]);
  const q = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => q(r[h])).join(','))].join('\n');
  return new Blob([csv], { type: 'text/csv' });
}
