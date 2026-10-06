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

export interface ExportSettings {
  creationDate: string;            // Định dạng DD/MM/YYYY (vd: 06/10/2026)
  fileNameDate: string;            // Định dạng DD.MM.YY (vd: 06.10.26)
  useCreationDateForAll: boolean;  // Thay toàn bộ cột F bằng ngày tạo
}
