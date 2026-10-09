export interface InvoiceItem {
  id: string;
  invoiceNumber: string | number;
  originalInvoiceDate: string; // Ngày trên hóa đơn (vd: 11/09/2026)
  appliedDate: string;         // Ngày áp dụng xuất bảng kê (Ngày tạo)
  sellerName: string;
  productName: string;
  weight: number;              // Trọng lượng thực tế (kg)
  unitPrice: number;           // Đơn giá (VND)
  totalAmount: number;         // Thành tiền (VND)
  imageUri?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export type DecimalSeparatorOption = 'auto' | 'comma' | 'dot';

export interface ExportSettings {
  creationDate: string;            // Định dạng DD/MM/YYYY (vd: 06/10/2026)
  fileNameDate: string;            // Định dạng DD.MM.YY (vd: 06.10.26)
  useCreationDateForAll: boolean;  // Thay toàn bộ cột F bằng ngày tạo
  decimalSeparator?: DecimalSeparatorOption; // Tùy chọn dấu thập phân: 'auto' (theo máy) | 'comma' (,) | 'dot' (.)
}

export function getInvoiceNumericValue(invNum: number | string): number {
  if (typeof invNum === 'number') return invNum;
  const match = String(invNum).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function sortInvoicesAscending(items: InvoiceItem[]): InvoiceItem[] {
  return [...items].sort((a, b) => {
    const numA = getInvoiceNumericValue(a.invoiceNumber);
    const numB = getInvoiceNumericValue(b.invoiceNumber);
    if (numA !== numB) {
      return numA - numB;
    }
    return String(a.invoiceNumber).localeCompare(String(b.invoiceNumber), undefined, {
      numeric: true,
    });
  });
}
