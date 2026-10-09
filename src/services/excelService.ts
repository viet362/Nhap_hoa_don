import * as XLSX from 'xlsx-js-style';
import * as FileSystem from 'expo-file-system/legacy';
import * as fflate from 'fflate';
import { InvoiceItem, ExportSettings, sortInvoicesAscending } from '../types/invoice';

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

function parseVietnameseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim().replace(/\s/g, '');

  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // VN format: 1.363,25 -> 1363.25
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // US format: 1,363.25 -> 1363.25
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      str = str.replace(/,/g, '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2) {
      if (parts[1].length === 3 && parseInt(parts[0], 10) > 0) {
        // 192.000 -> 192000 (đơn giá số nguyên)
        str = parts[0] + parts[1];
      }
    } else if (parts.length >= 3) {
      // Lỗi OCR xuất hiện 2 dấu chấm (1.363.25) -> dấu chấm cuối là thập phân
      if (parts[parts.length - 1].length <= 2) {
        str = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
      } else {
        str = parts.join('');
      }
    }
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

export function formatDecimalComma(val: number): string {
  const parts = Number(val || 0).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]}`;
}

export function formatDecimalDot(val: number): string {
  const parts = Number(val || 0).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${intPart}.${parts[1]}`;
}



export async function generateInvoiceExcel(
  items: InvoiceItem[],
  settings: ExportSettings
): Promise<{ fileUri: string; fileName: string; rawBytes?: Uint8Array }> {
  const workbook = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  const borderThin = {
    top: { style: 'thin', color: { rgb: 'FF000000' } },
    bottom: { style: 'thin', color: { rgb: 'FF000000' } },
    left: { style: 'thin', color: { rgb: 'FF000000' } },
    right: { style: 'thin', color: { rgb: 'FF000000' } },
  };

  const fillGreen = { patternType: 'solid', fgColor: { rgb: 'FFCCFFCC' } }; // Xanh cốm nhạt chuẩn theo file mẫu (#CCFFCC)
  const fillWhite = { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }; // Nền trắng chuẩn theo file mẫu

  // Định nghĩa các Style chuẩn xác 100% theo file mẫu gốc
  const styleTitle = {
    fill: fillWhite,
    font: { name: 'Times New Roman', sz: 14, bold: true, color: { rgb: 'FF000080' } }, // Chữ xanh tím than Navy (#000080)
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
  };

  const styleHdrTahoma = {
    fill: fillGreen,
    font: { name: 'Tahoma', sz: 14, bold: true, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };

  const styleHdrTimes = {
    fill: fillGreen,
    font: { name: 'Times New Roman', sz: 14, bold: true, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };

  const styleSubNumTahoma = {
    fill: fillWhite,
    font: { name: 'Tahoma', sz: 14, bold: false, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const styleSubNumTimes = {
    fill: fillWhite,
    font: { name: 'Times New Roman', sz: 14, bold: false, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const styleDataCenter = {
    fill: fillWhite,
    font: { name: 'Times New Roman', sz: 14, bold: false, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const styleDataLeft = {
    fill: fillWhite,
    font: { name: 'Times New Roman', sz: 14, bold: false, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  };

  const styleSum = {
    fill: fillWhite,
    font: { name: 'Times New Roman', sz: 16, bold: true, color: { rgb: 'FF000000' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const setCell = (
    r: number,
    c: number,
    val: string | number,
    type: 's' | 'n',
    style: any,
    numFmt?: string,
    formula?: string
  ) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    const cell: any = { t: type, v: val, s: style };
    if (numFmt) cell.z = numFmt;
    if (formula) cell.f = formula;
    ws[ref] = cell;
  };

  // Dòng 1: Tiêu đề chính (Merged A1:M1, Chữ xanh Navy #000080, Times New Roman 14pt Bold, Nền trắng)
  setCell(0, 0, 'BẢNG KÊ HOÁ ĐƠN, CHỨNG TỪ HÀNG HOÁ, DỊCH VỤ MUA VÀO', 's', styleTitle);

  // Đổ màu nền trắng và style cho các ô trong merge range Row 1
  for (let c = 1; c <= 12; c++) {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    ws[ref] = { t: 's', v: '', s: styleTitle };
  }

  // Dòng 2 & 3: Tiêu đề các cột (Nền xanh cốm #CCFFCC, 14pt Bold)
  // Cột A: STT
  setCell(1, 0, 'STT', 's', styleHdrTahoma);
  setCell(2, 0, '', 's', styleHdrTahoma);

  // Cột B-F: Hóa đơn, chứng từ...
  for (let c = 1; c <= 5; c++) {
    setCell(1, c, c === 1 ? 'Hoá đơn, chứng từ, biên lai nộp thuế' : '', 's', styleHdrTahoma);
  }
  setCell(2, 1, 'Mã hóa đơn', 's', styleHdrTahoma);
  setCell(2, 2, '', 's', styleHdrTahoma);
  setCell(2, 3, '', 's', styleHdrTahoma);
  setCell(2, 4, 'Số hoá đơn', 's', styleHdrTimes);
  setCell(2, 5, 'Ngày, tháng, năm lập hóa đơn', 's', styleHdrTimes);

  // Cột G - M
  setCell(1, 6, 'Tên người bán', 's', styleHdrTimes);
  setCell(2, 6, '', 's', styleHdrTimes);

  setCell(1, 7, 'Tên hàng hoá', 's', styleHdrTimes);
  setCell(2, 7, '', 's', styleHdrTimes);

  setCell(1, 8, 'Trọng lượng\n(kg)', 's', styleHdrTimes);
  setCell(2, 8, '', 's', styleHdrTimes);

  setCell(1, 9, 'Đơn giá', 's', styleHdrTimes);
  setCell(2, 9, '', 's', styleHdrTimes);

  setCell(1, 10, 'Giá trị HHDV\nmua vào chưa có thuế', 's', styleHdrTimes);
  setCell(2, 10, '', 's', styleHdrTimes);

  setCell(1, 11, 'Thuế GTGT\nđủ điều kiện khấu trừ thuế', 's', styleHdrTimes);
  setCell(2, 11, '', 's', styleHdrTimes);

  setCell(1, 12, 'Ghi chú', 's', styleHdrTimes);
  setCell(2, 12, '', 's', styleHdrTimes);

  // Dòng 4: Đánh số thứ tự (1), (2), (3)...
  setCell(3, 0, '(1)', 's', styleSubNumTahoma);
  setCell(3, 1, '', 's', styleSubNumTahoma);
  setCell(3, 2, '', 's', styleSubNumTahoma);
  setCell(3, 3, '', 's', styleSubNumTahoma);
  setCell(3, 4, '(2)', 's', styleSubNumTimes);
  setCell(3, 5, '(3)', 's', styleSubNumTimes);
  setCell(3, 6, '', 's', styleSubNumTimes);
  setCell(3, 7, '(4)', 's', styleSubNumTimes);
  setCell(3, 8, '', 's', styleSubNumTimes);
  setCell(3, 9, '', 's', styleSubNumTimes);
  setCell(3, 10, '(6)', 's', styleSubNumTimes);
  setCell(3, 11, '(7)', 's', styleSubNumTimes);
  setCell(3, 12, '(8)', 's', styleSubNumTimes);

  // Dòng 5 trở đi: Ghi từng hóa đơn (ĐÃ ĐƯỢC TỰ ĐỘNG SẮP XẾP SỐ HÓA ĐƠN TĂNG DẦN)
  const sortedItems = sortInvoicesAscending(items);
  const startRow = 4; // index 4 tương đương Row 5
  sortedItems.forEach((item, idx) => {
    const r = startRow + idx;
    const rowNum = r + 1;

    // Cột A-D trống
    for (let c = 0; c <= 3; c++) {
      setCell(r, c, '', 's', styleDataCenter);
    }

    // E: Số hóa đơn
    const numVal =
      typeof item.invoiceNumber === 'number'
        ? item.invoiceNumber
        : /^\d+$/.test(String(item.invoiceNumber))
        ? parseInt(String(item.invoiceNumber), 10)
        : String(item.invoiceNumber);

    if (typeof numVal === 'number') {
      setCell(r, 4, numVal, 'n', styleDataCenter);
    } else {
      setCell(r, 4, numVal, 's', styleDataCenter);
    }

    // F: Ngày lập (thay bằng ngày tạo nếu bật)
    const dateVal = settings.useCreationDateForAll
      ? settings.creationDate
      : item.appliedDate || item.originalInvoiceDate;
    setCell(r, 5, dateVal, 's', styleDataCenter);

    // G: Người bán (Căn trái)
    setCell(
      r,
      6,
      item.sellerName || 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
      's',
      styleDataLeft
    );

    // H: Tên hàng hoá
    setCell(r, 7, item.productName, 's', styleDataCenter);

    // I: Trọng lượng (kg)
    const weightVal =
      typeof item.weight === 'number' ? item.weight : parseVietnameseNumber(item.weight);
    // J: Đơn giá
    const priceVal =
      typeof item.unitPrice === 'number' ? item.unitPrice : parseVietnameseNumber(item.unitPrice);
    const lineTotal = Math.round((weightVal || 0) * (priceVal || 0));

    const decSep = settings.decimalSeparator || 'auto';
    if (decSep === 'comma') {
      // Ép buộc dấu phẩy (,) cho phần thập phân (chuẩn VN: 1.363,25)
      setCell(r, 8, formatDecimalComma(weightVal || 0), 's', styleDataCenter);
      setCell(r, 9, Math.round(priceVal || 0), 'n', styleDataCenter, '#,##0');
      setCell(r, 10, lineTotal, 'n', styleDataCenter, '#,##0');
    } else if (decSep === 'dot') {
      // Ép buộc dấu chấm (.) cho phần thập phân (chuẩn US: 1,363.25)
      setCell(r, 8, formatDecimalDot(weightVal || 0), 's', styleDataCenter);
      setCell(r, 9, Math.round(priceVal || 0), 'n', styleDataCenter, '#,##0');
      setCell(r, 10, lineTotal, 'n', styleDataCenter, '#,##0');
    } else {
      // 'auto': Tự động theo máy/khu vực hệ điều hành (kiểu Number Float '#,##0.00' kèm công thức Excel)
      setCell(r, 8, weightVal || 0, 'n', styleDataCenter, '#,##0.00');
      setCell(r, 9, Math.round(priceVal || 0), 'n', styleDataCenter, '#,##0');
      setCell(r, 10, lineTotal, 'n', styleDataCenter, '#,##0', `I${rowNum}*J${rowNum}`);
    }

    // L: Thuế GTGT
    setCell(r, 11, '', 's', styleDataCenter);

    // M: Ghi chú
    setCell(r, 12, '', 's', styleDataCenter);
  });

  const endRowIdx = sortedItems.length > 0 ? startRow + sortedItems.length - 1 : startRow;
  const totalRowIdx = endRowIdx + 1;
  const totalRowNum = totalRowIdx + 1;
  const firstDataRowNum = startRow + 1;
  const lastDataRowNum = endRowIdx + 1;

  // Tính tổng thành tiền trước để đảm bảo giá trị hiển thị luôn chính xác 100%
  const grandTotal = sortedItems.reduce((acc, it) => {
    const w = typeof it.weight === 'number' ? it.weight : parseVietnameseNumber(it.weight);
    const p = typeof it.unitPrice === 'number' ? it.unitPrice : parseVietnameseNumber(it.unitPrice);
    return acc + Math.round((w || 0) * (p || 0));
  }, 0);

  // Dòng Tổng cộng - Đóng khung viền mỏng đầy đủ cho tất cả các ô từ Cột A đến Cột M
  for (let c = 0; c <= 12; c++) {
    if (c === 10 && sortedItems.length > 0) {
      // Ô Tổng cộng K
      setCell(
        totalRowIdx,
        c,
        grandTotal,
        'n',
        styleSum,
        '#,##0',
        `SUM(K${firstDataRowNum}:K${lastDataRowNum})`
      );
    } else {
      setCell(totalRowIdx, c, '', 's', styleDataCenter);
    }
  }

  // Khai báo phạm vi ô hiển thị
  ws['!ref'] = `A1:M${totalRowNum}`;

  // Cấu hình Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // A1:M1
    { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },  // A2:A3
    { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } },  // B2:F2
    { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },  // G2:G3
    { s: { r: 1, c: 7 }, e: { r: 2, c: 7 } },  // H2:H3
    { s: { r: 1, c: 8 }, e: { r: 2, c: 8 } },  // I2:I3
    { s: { r: 1, c: 9 }, e: { r: 2, c: 9 } },  // J2:J3
    { s: { r: 1, c: 10 }, e: { r: 2, c: 10 } }, // K2:K3
    { s: { r: 1, c: 11 }, e: { r: 2, c: 11 } }, // L2:L3
    { s: { r: 1, c: 12 }, e: { r: 2, c: 12 } }, // M2:M3
  ];

  // Chiều cao các dòng (Row heights theo chuẩn mẫu gốc)
  const rowsConfig: any[] = [
    { hpt: 24.0 },  // Row 1: Tiêu đề
    { hpt: 58.8 },  // Row 2: Tiêu đề bảng cấp 1
    { hpt: 69.6 },  // Row 3: Tiêu đề bảng cấp 2
    { hpt: 18.75 }, // Row 4: Chỉ số cột (1), (2)...
  ];
  const dataRowCount = sortedItems.length > 0 ? sortedItems.length : 1;
  for (let i = 0; i < dataRowCount; i++) {
    rowsConfig.push({ hpt: 36.0 }); // Các dòng dữ liệu
  }
  rowsConfig.push({ hpt: 18.75 }); // Dòng Tổng cộng
  ws['!rows'] = rowsConfig;

  // ⭐️ ĐẶC BIỆT: CỘT A ĐẾN D CHỦ ĐỘNG ẨN (hidden: true) NHƯ YÊU CẦU
  ws['!cols'] = [
    { hidden: true, wch: 0 },   // Cột A: Ẩn
    { hidden: true, wch: 0 },   // Cột B: Ẩn
    { hidden: true, wch: 0 },   // Cột C: Ẩn
    { hidden: true, wch: 0 },   // Cột D: Ẩn
    { wch: 14 },                // Cột E: Số hoá đơn (đủ rộng không bị rớt số)
    { wch: 16 },                // Cột F: Ngày lập (vừa vặn 2 dòng, không rớt chữ 'đơn')
    { wch: 65.55 },             // Cột G: Tên người bán
    { wch: 39.44 },             // Cột H: Tên hàng hoá
    { wch: 14.5 },              // Cột I: Trọng lượng (kg) (vừa vặn 'Trọng lượng' / '(kg)' 2 dòng)
    { wch: 13 },                // Cột J: Đơn giá
    { wch: 26.11 },             // Cột K: Thành tiền
    { wch: 18 },                // Cột L: Thuế GTGT
    { wch: 15 },                // Cột M: Ghi chú
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');

  // Xuất file ra Base64 ban đầu với xlsx-js-style
  const rawBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

  // ⭐️ TỐI ƯU HÓA ĐẶC BIỆT BẰNG FFLATE:
  // Post-process các file XML trong gói ZIP nhằm bảo đảm 100% khớp chuẩn OpenXML gốc:
  // 1. Cột A đến D chủ động ẩn (<col min="1" max="4" width="0" hidden="1" customWidth="1"/>)
  // 2. Định vị Viewport bắt đầu tại ô E3 (topLeftCell="E3")
  // 3. Màu sắc chuẩn ARGB (Navy Blue #000080, Xanh cốm #CCFFCC, Trắng #FFFFFF)
  let finalBase64 = rawBase64;
  try {
    const zipBytes = base64ToUint8Array(rawBase64);
    const unzipped = fflate.unzipSync(zipBytes);

    // 1. Cấu hình sheet1.xml
    if (unzipped['xl/worksheets/sheet1.xml']) {
      let sheetXml = fflate.strFromU8(unzipped['xl/worksheets/sheet1.xml']);

      const exactColsXml =
        '<cols>' +
        '<col min="1" max="1" width="0" hidden="1" customWidth="1"/>' +
        '<col min="2" max="2" width="0" hidden="1" customWidth="1"/>' +
        '<col min="3" max="3" width="0" hidden="1" customWidth="1"/>' +
        '<col min="4" max="4" width="0" hidden="1" customWidth="1"/>' +
        '<col min="5" max="5" width="14" customWidth="1"/>' +
        '<col min="6" max="6" width="16" customWidth="1"/>' +
        '<col min="7" max="7" width="65.55" customWidth="1"/>' +
        '<col min="8" max="8" width="39.44" customWidth="1"/>' +
        '<col min="9" max="9" width="14.5" customWidth="1"/>' +
        '<col min="10" max="10" width="13" customWidth="1"/>' +
        '<col min="11" max="11" width="26.11" customWidth="1"/>' +
        '<col min="12" max="12" width="18" customWidth="1"/>' +
        '<col min="13" max="13" width="15" customWidth="1"/>' +
        '</cols>';

      if (sheetXml.includes('<cols>')) {
        sheetXml = sheetXml.replace(/<cols>.*?<\/cols>/s, exactColsXml);
      } else {
        sheetXml = sheetXml.replace('<sheetData>', exactColsXml + '<sheetData>');
      }

      // Đặt topLeftCell="E3" để mọi phần mềm Excel trên điện thoại & máy tính mở trực tiếp tại Cột E
      // Khắc phục triệt để lỗi corrupt XML do regex thay thế sai thẻ <sheetViews>
      if (sheetXml.includes('<sheetViews>')) {
        sheetXml = sheetXml.replace(
          /<sheetViews>.*?<\/sheetViews>/s,
          '<sheetViews><sheetView tabSelected="1" topLeftCell="E3" workbookViewId="0"/></sheetViews>'
        );
      } else {
        sheetXml = sheetXml.replace(
          '<sheetData>',
          '<sheetViews><sheetView tabSelected="1" topLeftCell="E3" workbookViewId="0"/></sheetViews><sheetData>'
        );
      }

      // Bỏ cảnh báo tam giác xanh lá cây (Number stored as text) một cách an toàn
      if (sheetXml.includes('<ignoredErrors>')) {
        sheetXml = sheetXml.replace(
          /<ignoredErrors>.*?<\/ignoredErrors>/s,
          '<ignoredErrors><ignoredError sqref="A1:M500" numberStoredAsText="1"/></ignoredErrors>'
        );
      } else {
        sheetXml = sheetXml.replace(
          '</worksheet>',
          '<ignoredErrors><ignoredError sqref="A1:M500" numberStoredAsText="1"/></ignoredErrors></worksheet>'
        );
      }

      unzipped['xl/worksheets/sheet1.xml'] = fflate.strToU8(sheetXml);
    }

    // 2. Chuẩn hóa styles.xml (đảm bảo đầy đủ ARGB và không bị mờ/mất màu trên điện thoại)
    if (unzipped['xl/styles.xml']) {
      let stylesXml = fflate.strFromU8(unzipped['xl/styles.xml']);
      stylesXml = stylesXml.replace(/color rgb="000080"/g, 'color rgb="FF000080"');
      stylesXml = stylesXml.replace(/color rgb="000000"/g, 'color rgb="FF000000"');
      stylesXml = stylesXml.replace(/fgColor rgb="CCFFCC"/g, 'fgColor rgb="FFCCFFCC"');
      stylesXml = stylesXml.replace(/fgColor rgb="FFFFFF"/g, 'fgColor rgb="FFFFFFFF"');
      unzipped['xl/styles.xml'] = fflate.strToU8(stylesXml);
    }

    const patchedZip = fflate.zipSync(unzipped);
    finalBase64 = uint8ArrayToBase64(patchedZip);
  } catch (err) {
    console.warn('Post-processing Excel XML warning (fallback to raw):', err);
    finalBase64 = rawBase64;
  }

  const fileName = `BẢNG KÊ HÀNG HÓA MUA VÀO NGÀY ${settings.fileNameDate}.xlsx`;

  // Hỗ trợ Web Browser: Tạo Blob URL và rawBytes để Share thực tế, KHÔNG tự động click tải về tại đây
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const bytes = base64ToUint8Array(finalBase64);
    const blob = new Blob([bytes as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const blobUrl = URL.createObjectURL(blob);
    return { fileUri: blobUrl, fileName, rawBytes: bytes };
  }

  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  const fileUri = `${baseDir}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, finalBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { fileUri, fileName };
}
