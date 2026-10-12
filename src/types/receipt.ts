export interface ReceiptItem {
  rowIndex: number;
  rawInvoiceNumber: string;    // Chuỗi số gốc trong Cột A (vd: "00001117")
  cleanInvoiceNumber: string;  // Số hiển thị đã bỏ số 0 ở đầu (vd: "1117")
  dateStr: string;             // Ngày lập trên Cột D (vd: "26/09/2026")
  amount: number;              // Số tiền doanh thu Cột Q (vd: 49580000)
  amountFormatted: string;     // Số tiền có phân cách hàng nghìn (vd: "49.580.000")
  amountInWords: string;       // Bằng chữ tiếng Việt (vd: "Bốn mươi chín triệu...")
  itemName?: string;           // Tên hàng hóa Cột M (vd: "Tôm thẻ chân trắng...")
  customerName?: string;       // Khách hàng / Ghi chú Cột H hoặc F
  isDateValid: boolean;
  isAmountValid: boolean;
  hasErrors: boolean;
  errorMessages: string[];
}

export interface ReceiptConfig {
  companyName: string;
  companyAddress: string;
  submitterName: string;
  submitterAddress: string;
  paymentReason: string;
  directorName: string;
  chiefAccountantName: string;
  treasurerName: string;
  creatorName: string;
}

export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  companyName: 'CÔNG TY TNHH TMDV THÀNH NGUYỆT',
  companyAddress: 'Thôn 7 Hạ Trạch, xã Bắc Trạch, T. Quảng Trị',
  submitterName: 'Nguyễn Thị Kim Liên',
  submitterAddress: 'công ty TNHH TMDV Thành Nguyệt',
  paymentReason: 'Bán hàng thu tiền mặt',
  directorName: 'Trần Quang Thành',
  chiefAccountantName: 'Nguyễn Thị Nguyệt',
  treasurerName: 'Nguyễn Thị Kim Liên',
  creatorName: 'Nguyễn Thị Nguyệt',
};

export interface SheetInfo {
  name: string;
  rowCount: number;
  sampleItems: {
    rowIndex: number;
    invoiceNumber: string;
    date: string;
    amount: number;
  }[];
}

export interface ReceiptProcessResult {
  totalCount: number;
  successCount: number;
  failedCount: number;
  items: ReceiptItem[];
  failedItems: ReceiptItem[];
  fileUri: string;
  fileName: string;
  rawBytes?: Uint8Array;
}
