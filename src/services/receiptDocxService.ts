import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as fflate from 'fflate';
import { ReceiptItem, ReceiptConfig, DEFAULT_RECEIPT_CONFIG, ReceiptProcessResult } from '../types/receipt';
import { numberToWordsVietnamese } from './vietnameseNumberToWords';
import templateData from '../assets/receiptDocxTemplate.json';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; ) {
    const enc1 = chars.indexOf(clean.charAt(i++));
    const enc2 = chars.indexOf(clean.charAt(i++));
    const enc3 = chars.indexOf(clean.charAt(i++));
    const enc4 = chars.indexOf(clean.charAt(i++));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    bytes.push(chr1);
    if (enc3 !== 64 && enc3 !== -1) bytes.push(chr2);
    if (enc4 !== 64 && enc4 !== -1) bytes.push(chr3);
  }
  return new Uint8Array(bytes);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 8192) {
      const chunk = bytes.subarray(i, Math.min(i + 8192, len));
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  }
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const chr1 = bytes[i++];
    const chr2 = i < bytes.length ? bytes[i++] : NaN;
    const chr3 = i < bytes.length ? bytes[i++] : NaN;
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;
    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

export function formatVnCurrency(num: number): string {
  return Math.round(num || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Đọc file Excel từ ArrayBuffer hoặc Base64 thành XLSX Workbook
 */
export function readWorkbook(data: ArrayBuffer | Uint8Array | string): XLSX.WorkBook {
  if (typeof data === 'string') {
    return XLSX.read(data, { type: 'base64' });
  }
  return XLSX.read(data, { type: 'array' });
}

/**
 * Trích xuất các dòng dữ liệu tiềm năng từ 1 Sheet trong Workbook
 * Cột A (col 0): Index / Số HĐ
 * Cột D (col 3): Ngày lập (DD/MM/YYYY)
 * Cột Q (col 16): Số tiền
 */
export function extractSheetReceiptItems(
  workbook: XLSX.WorkBook,
  sheetName: string
): ReceiptItem[] {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Q1');
  const items: ReceiptItem[] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    // Đọc ô A (Số HĐ)
    const cellA = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    const valA = cellA ? String(cellA.v ?? '').trim() : '';

    // Bỏ qua dòng trống hoặc dòng công thức tổng cộng
    if (!valA || /^(tổng|sum|cộng|stt)/i.test(valA)) {
      continue;
    }

    // Đọc ô D (Ngày)
    const cellD = ws[XLSX.utils.encode_cell({ r, c: 3 })];
    let valD = '';
    if (cellD) {
      if (cellD.w) {
        valD = String(cellD.w).trim();
      } else if (cellD.v instanceof Date) {
        const d = cellD.v;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        valD = `${dd}/${mm}/${yyyy}`;
      } else {
        valD = String(cellD.v ?? '').trim();
      }
    }

    // Đọc ô Q (Tiền)
    const cellQ = ws[XLSX.utils.encode_cell({ r, c: 16 })];
    let valQ = 0;
    if (cellQ) {
      if (typeof cellQ.v === 'number') {
        valQ = cellQ.v;
      } else {
        const parsed = parseFloat(String(cellQ.v).replace(/[^\d.-]/g, ''));
        valQ = isNaN(parsed) ? 0 : parsed;
      }
    }

    // Kiểm tra tính hợp lệ
    const isDateValid = Boolean(valD && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valD));
    const isAmountValid = Boolean(valQ && valQ > 0);
    const errorMessages: string[] = [];

    if (!isDateValid) {
      errorMessages.push('Cột D thiếu hoặc sai định dạng ngày (cần DD/MM/YYYY)');
    }
    if (!isAmountValid) {
      errorMessages.push('Cột Q thiếu hoặc số tiền bằng 0');
    }

    const cleanNum = valA.replace(/^0+/, '') || valA;

    // Đọc ô M (Tên mặt hàng/diễn giải nếu có)
    const cellM = ws[XLSX.utils.encode_cell({ r, c: 12 })];
    const valM = cellM ? String(cellM.v ?? '').trim() : '';

    // Đọc ô H hoặc F (Người mua / Khách hàng nếu có)
    const cellH = ws[XLSX.utils.encode_cell({ r, c: 7 })];
    const cellF = ws[XLSX.utils.encode_cell({ r, c: 5 })];
    const valCustomer = cellH ? String(cellH.v ?? '').trim() : (cellF ? String(cellF.v ?? '').trim() : '');

    items.push({
      rowIndex: r + 1, // 1-indexed theo giao diện Excel
      rawInvoiceNumber: valA,
      cleanInvoiceNumber: cleanNum,
      dateStr: valD,
      amount: valQ,
      amountFormatted: isAmountValid ? formatVnCurrency(valQ) : '....................',
      amountInWords: isAmountValid ? numberToWordsVietnamese(valQ) : '................................................................',
      itemName: valM,
      customerName: valCustomer,
      isDateValid,
      isAmountValid,
      hasErrors: errorMessages.length > 0,
      errorMessages,
    });
  }

  return items;
}

/**
 * Sinh file Word DOCX theo Mẫu số 01-TT (TT 133/2016/TT-BTC)
 * Với những item có lỗi, vẫn sinh phiếu thu với thông tin mặc định, chừa trống thông tin bị thiếu
 */
export async function generateReceiptsDocx(
  items: ReceiptItem[],
  customConfig?: Partial<ReceiptConfig>,
  customFileName?: string
): Promise<ReceiptProcessResult> {
  const config: ReceiptConfig = { ...DEFAULT_RECEIPT_CONFIG, ...customConfig };

  const failedItems = items.filter((item) => item.hasErrors);
  const successCount = items.length - failedItems.length;

  let bodyContent = '';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let snippet = templateData.receiptSnippet;

    // 1. Thay thế Số hóa đơn (bỏ số 0 đầu)
    snippet = snippet.replace(/{{INVOICE_NUM}}/g, item.cleanInvoiceNumber || item.rawInvoiceNumber || '......');

    // 2. Thay thế Ngày lập (hoặc chừa chấm nếu lỗi)
    const dateText = item.isDateValid ? item.dateStr : '..../..../........';
    snippet = snippet.replace(/{{DATE_STR}}/g, dateText);

    // 3. Thay thế Số tiền (hoặc chừa chấm nếu lỗi)
    const amountText = item.isAmountValid ? item.amountFormatted : '....................';
    snippet = snippet.replace(/{{AMOUNT_STR}}/g, amountText);

    // 4. Thay thế Bằng chữ tiếng Việt
    const wordsText = item.isAmountValid ? item.amountInWords : '................................................................';
    snippet = snippet.replace(/{{AMOUNT_WORDS}}/g, wordsText);

    // 5. Cập nhật thông tin cấu hình công ty / người nộp / chữ ký nếu người dùng có tùy chỉnh
    if (config.companyName !== DEFAULT_RECEIPT_CONFIG.companyName) {
      snippet = snippet.replace(/CÔNG TY TNHH TM/g, config.companyName.slice(0, 15));
      snippet = snippet.replace(/DV THÀNH NGUYỆT/g, config.companyName.slice(15));
    }
    if (config.submitterName !== DEFAULT_RECEIPT_CONFIG.submitterName) {
      snippet = snippet.replace(/Nguyễn Thị Kim Liên/g, config.submitterName);
    }
    if (config.directorName !== DEFAULT_RECEIPT_CONFIG.directorName) {
      snippet = snippet.replace(/Trần Quang Thành/g, config.directorName);
    }
    if (config.chiefAccountantName !== DEFAULT_RECEIPT_CONFIG.chiefAccountantName) {
      snippet = snippet.replace(/Nguyễn Thị Nguyệt/g, config.chiefAccountantName);
    }

    bodyContent += snippet;
  }

  // Kết hợp thành word/document.xml hoàn chỉnh
  const fullDocumentXml = templateData.header + bodyContent + templateData.footer;

  // Xây dựng cấu trúc các file trong zip DOCX
  const zipFiles: { [filename: string]: Uint8Array } = {};

  // Thêm tất cả các file cấu trúc Word tĩnh (styles.xml, fontTable.xml, [Content_Types].xml...)
  const nonDocFiles = templateData.nonDocFiles as Record<string, string>;
  for (const [filename, base64Str] of Object.entries(nonDocFiles)) {
    zipFiles[filename] = base64ToUint8Array(base64Str);
  }

  // Thêm document.xml mới tạo
  zipFiles['word/document.xml'] = fflate.strToU8(fullDocumentXml);

  // Nén thành file zip DOCX bằng fflate
  const zippedBytes = fflate.zipSync(zipFiles);
  const base64Docx = uint8ArrayToBase64(zippedBytes);

  const fileName =
    customFileName ||
    `PHIEU_THU_${items.length > 0 ? items[0].cleanInvoiceNumber : '00'}_DEN_${
      items.length > 0 ? items[items.length - 1].cleanInvoiceNumber : '00'
    }.docx`;

  // Môi trường Web
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([zippedBytes as any], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const blobUrl = URL.createObjectURL(blob);
    return {
      totalCount: items.length,
      successCount,
      failedCount: failedItems.length,
      items,
      failedItems,
      fileUri: blobUrl,
      fileName,
      rawBytes: zippedBytes,
    };
  }

  // Môi trường Native Mobile (Expo)
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  const fileUri = `${baseDir}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64Docx, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    totalCount: items.length,
    successCount,
    failedCount: failedItems.length,
    items,
    failedItems,
    fileUri,
    fileName,
    rawBytes: zippedBytes,
  };
}
