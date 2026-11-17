// Port of the create-order parts of OrdersService (chunk WXLYQ5IA): bulk import, file upload,
// single (quick) order and the client-side sample templates. Spec: docs/specs/02-create-order-customer-master.md §1.4–1.5, §2.5, §5.1.
// (The rest of OrdersService — search, details, fix-errors, delivery address… — is owned by the Orders feature.)
import * as XLSX from 'xlsx';
import { getConfig } from '../config';
import { http } from '../http';
import { rememberUploadedFile } from '../../mock/routes/createOrder';

const ordersUrl = () => `${getConfig().buyerUrl}/orders`;

export interface UploadedFilePayload {
  fileName: string;
  fileExtension: string;
  /** base64 */
  fileData: string;
}

export interface ImportResult {
  success: boolean;
  data?: any;
  error?: { code: number; message: string };
}

/** Exact header row of the sample template (38 columns; also the mandatory column list). */
export const ORDER_IMPORT_HEADERS: string[] = [
  'Customer ID', 'UID', 'Order ID', 'Invoice ID', 'Billing Date', 'Category', 'Category Code', 'MSKU Code', 'Item Code',
  'Item Description', 'Entered Qty', 'Entered UOM', 'Qty', 'UOM', 'Net Invoice Value', 'Weight', 'Gross Weight Per Piece',
  'Unit', 'Total CFC', 'CFC Conversion', 'PAC Conversion', 'Store Name', 'Store Address', 'Delivery Lat', 'Delivery Long',
  'Store Mobile Number', 'Length', 'Width', 'Height', 'CFC Dimensions unit', 'WD Dest Code', 'WD Name', 'MRP', 'BATCH',
  'OrderType', 'DsName', 'BeatName', 'DsType',
];

const STORE_ADDRESS = 'WAZIRABAD NEAR-SEC-52 GURUGRAM HARYANA,WAZIRABAD NEAR-SEC-52 GURUGRAM HARYANA,Haryana,INDIA';

/** One sample row, in header order. Values copied verbatim from the production template (incl. the stray apostrophe in UID). */
function sampleRow(v: {
  category: string; categoryCode: string; msku: string; itemCode: string; description: string; qty: number; uom: string;
  niv: number; weight: number; gwpp: number; totalCfc: number; cfcConv: number; pacConv: number; l: number; w: number; h: number; mrp: number; batch: string;
}): (string | number)[] {
  return [
    '22UIMP092400100', "DLR00393'", 'ASC/25-26/000084', 'I12/25-26/002169', '7/26/2025 12:00:00 AM', v.category, v.categoryCode, v.msku,
    v.itemCode, v.description, v.qty, v.uom, v.qty, v.uom, v.niv, v.weight, v.gwpp, 'KG', v.totalCfc, v.cfcConv, v.pacConv,
    'ROHIT DEPARTMENTAL STORE', STORE_ADDRESS, 28.431469, 77.088234, 9599116902, v.l, v.w, v.h, 'Meter', 'DE515112',
    'SHRI KRISHNA ENTERPRISES', v.mrp, v.batch, 'Digital', 'John Doe', 'Beat 1', 'Direct',
  ];
}

export const ORDER_IMPORT_SAMPLE_ROWS: (string | number)[][] = [
  sampleRow({ category: '06 ATTA', categoryCode: 'AT', msku: 'ASATTANMP5KG', itemCode: 'FJ2112QSF', description: 'ASVD SHUDH CHAKKI ATTA 5KG QC PR_FJ2112QSF', qty: 1, uom: 'PAC', niv: 200, weight: 5, gwpp: 5, totalCfc: 0.166666, cfcConv: 30, pacConv: 5, l: 0.4, w: 0.3, h: 0.38, mrp: 259, batch: '17B170725' }),
  sampleRow({ category: '99 YOGA BAR', categoryCode: 'YB', msku: 'ENB PUCHPENTBTR70G', itemCode: 'FYB18603', description: 'ENROBEDBAR POWERUP CHOPENUTBTR70G_FYB18603', qty: 36, uom: 'PAC', niv: 3528.33, weight: 2.52, gwpp: 0.07, totalCfc: 0.25, cfcConv: 10.08, pacConv: 0.07, l: 0.49, w: 0.4, h: 0.154, mrp: 140, batch: 'AB17052501' }),
  sampleRow({ category: '99 YOGA BAR', categoryCode: 'YB', msku: 'ENB20GPPCCPENTBT70', itemCode: 'FYB18608', description: 'ENRBEDBR20GPRPWUPCFECRSHPENTBTR70G_FYB18608', qty: 36, uom: 'PAC', niv: 3528.3315, weight: 2.52, gwpp: 0.07, totalCfc: 0.25, cfcConv: 10.08, pacConv: 0.07, l: 0.49, w: 0.4, h: 0.155, mrp: 140, batch: 'AC16052501' }),
  sampleRow({ category: '03 BISCUIT', categoryCode: 'BI', msku: 'SFMARIELT366', itemCode: 'FB701431C', description: 'SUNFEAST MARIE LGT ACTIVE 186G_FB701431C', qty: 2, uom: 'CFC', niv: 1626.2406, weight: 11.16, gwpp: 5.58, totalCfc: 2, cfcConv: 5.58, pacConv: 0.186, l: 0.393, w: 0.249, h: 0.328, mrp: 30, batch: 'B13030625' }),
  sampleRow({ category: '22 NOODLES', categoryCode: 'ND', msku: 'WOWMASALARS10', itemCode: 'FND2310B', description: 'YIPPEE WOW MASALA NOODLES 50G LADI_FND2310B', qty: 1, uom: 'CFC', niv: 792.4537, weight: 4.8, gwpp: 4.8, totalCfc: 1, cfcConv: 4.8, pacConv: 0.05, l: 0.425, w: 0.31, h: 0.215, mrp: 10, batch: 'A05JUN25' }),
];

function download(data: BlobPart, fileName: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function buildSampleWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([ORDER_IMPORT_HEADERS, ...ORDER_IMPORT_SAMPLE_ROWS]);
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  return wb;
}

export const orderCreateService = {
  /** PUT {fileServicesUrl}/documents/{folder} — returns the raw body (caller reads data.url). Errors propagate. */
  async billsUpload(file: UploadedFilePayload, folder: string): Promise<any> {
    const res = await http.put<any>(`${getConfig().fileServicesUrl}/documents/${folder}`, file);
    // [mock side-channel] the shared core upload route does not keep the file bytes, so hand them to the
    // import-orders mock (keyed by the returned URL). The real backend downloads the file from fileUrl instead.
    if (res?.data?.url) rememberUploadedFile(res.data.url, file.fileData);
    return res;
  },

  /** POST /orders/import-orders — never throws; any 2xx is a success (the body is not inspected). */
  async orderImport(body: { buyerId: string; fileUrl: string }): Promise<ImportResult> {
    try {
      const data = await http.post<any>(`${ordersUrl()}/import-orders`, body);
      return { success: true, data };
    } catch (err: any) {
      let msg: string = err?.error?.error?.message || err?.error?.message || 'Order import failed! Please try again.';
      if (msg.includes('Transaction query already complete')) msg = 'Duplicate orders detected. These orders have already been imported.';
      return { success: false, error: { code: err?.status || err?.error?.error?.code || 500, message: msg } };
    }
  },

  /** POST /orders — returns `data`; throws Error(message) on success:false or HTTP errors. */
  async createSingleOrder(payload: Record<string, unknown>): Promise<any> {
    let res: any;
    try {
      res = await http.post<any>(ordersUrl(), payload);
    } catch (err: any) {
      throw new Error(err?.error?.error?.message || err?.message || 'Failed to create order', { cause: err });
    }
    if (res?.success) return res.data;
    throw new Error(res?.error?.message || 'Failed to create order');
  },

  /** Unused stub in the original (kept for parity). */
  uploadOrders(): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: 'Orders uploaded successfully' });
  },

  downloadSampleExcel() {
    const buf = XLSX.write(buildSampleWorkbook(), { bookType: 'xlsx', type: 'array' });
    download(buf, 'sample-orders.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  },

  downloadSampleCsv() {
    const buf = XLSX.write(buildSampleWorkbook(), { bookType: 'csv', type: 'array' });
    download(buf, 'sample-orders.csv', 'text/csv;charset=utf-8;');
  },

  /** The PDF "sample" is an empty text file (reachable only from the inert PDF/Manual cards). */
  downloadSamplePdf() {
    download('', 'sample-orders.txt', 'text/plain');
  },
};
