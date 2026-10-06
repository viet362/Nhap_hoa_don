import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvoiceItem } from '../types/invoice';

const GEMINI_API_KEY_STORAGE = '@gemini_api_key';

export async function getStoredApiKey(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(GEMINI_API_KEY_STORAGE)) || '';
  } catch {
    return '';
  }
}

export async function saveStoredApiKey(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Không thể lưu API Key', e);
  }
}

// 11 Dữ liệu mẫu thực tế đối chiếu từ thư mục Sample
export const SAMPLE_PRESET_INVOICES: Omit<InvoiceItem, 'id' | 'status'>[] = [
  {
    invoiceNumber: 208,
    originalInvoiceDate: '11/09/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 30 Con/Kg',
    weight: 5753.10,
    unitPrice: 177000,
    totalAmount: 1018298700,
    fileName: 'IMG_...648_...443.jpg (HĐ 208)',
  },
  {
    invoiceNumber: 395,
    originalInvoiceDate: '12/09/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 25 Con/Kg',
    weight: 1363.25,
    unitPrice: 192000,
    totalAmount: 261744000,
    fileName: 'IMG_...719_...196.jpg (HĐ 395)',
  },
  {
    invoiceNumber: 394,
    originalInvoiceDate: '12/09/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 28 Con/Kg',
    weight: 1050.45,
    unitPrice: 185000,
    totalAmount: 194333250,
    fileName: 'IMG_...744_...679.jpg (HĐ 394)',
  },
  {
    invoiceNumber: 393,
    originalInvoiceDate: '12/09/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 28 Con/Kg',
    weight: 1637.85,
    unitPrice: 185000,
    totalAmount: 303002250,
    fileName: 'IMG_...767_...129.jpg (HĐ 393)',
  },
  {
    invoiceNumber: 210,
    originalInvoiceDate: '12/09/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 30 Con/Kg',
    weight: 3518.45,
    unitPrice: 177000,
    totalAmount: 622765650,
    fileName: 'IMG_...789_...646.jpg (HĐ 210)',
  },
  {
    invoiceNumber: 209,
    originalInvoiceDate: '12/09/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 30 Con/Kg',
    weight: 3731.90,
    unitPrice: 177000,
    totalAmount: 660546300,
    fileName: 'IMG_...815_...128.jpg (HĐ 209)',
  },
  {
    invoiceNumber: 300,
    originalInvoiceDate: '30/07/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 56 Con/Kg',
    weight: 2508.40,
    unitPrice: 134000,
    totalAmount: 336125600,
    fileName: 'IMG_...861_...596.jpg (HĐ 300)',
  },
  {
    invoiceNumber: 299,
    originalInvoiceDate: '30/07/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 62 Con/Kg',
    weight: 2650.20,
    unitPrice: 128000,
    totalAmount: 339225600,
    fileName: 'IMG_...887_...211.jpg (HĐ 299)',
  },
  {
    invoiceNumber: 164,
    originalInvoiceDate: '07/08/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 29 Con/Kg',
    weight: 4814.60,
    unitPrice: 180000,
    totalAmount: 866628000,
    fileName: 'IMG_...929_...428.jpg (HĐ 164)',
  },
  {
    invoiceNumber: 340,
    originalInvoiceDate: '16/08/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 28 Con/Kg',
    weight: 2915.80,
    unitPrice: 183000,
    totalAmount: 533591400,
    fileName: 'IMG_...964_...644.jpg (HĐ 340)',
  },
  {
    invoiceNumber: 339,
    originalInvoiceDate: '16/08/2026',
    appliedDate: '06/10/2026',
    sellerName: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
    productName: 'Tôm Thẻ Chân Trắng Cỡ 28 Con/Kg',
    weight: 2825.30,
    unitPrice: 183000,
    totalAmount: 517029900,
    fileName: 'IMG_...990_...275.jpg (HĐ 339)',
  },
];

export async function extractInvoiceWithGemini(
  imageUri: string,
  apiKey: string,
  creationDate: string
): Promise<Partial<InvoiceItem>> {
  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt để nhập API Key.');
  }

  // Đọc ảnh sang base64 (hỗ trợ cả Mobile Native và Web)
  let base64Data = '';
  if (typeof window !== 'undefined' && (imageUri.startsWith('blob:') || imageUri.startsWith('data:'))) {
    const res = await fetch(imageUri);
    const blob = await res.blob();
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const b64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const prompt = `Bạn là chuyên gia trích xuất dữ liệu hóa đơn điện tử giá trị gia tăng (VAT) Việt Nam.
Hãy đọc ảnh hóa đơn này và trích xuất chính xác các thông tin:
1. invoiceNumber: Số hóa đơn (chỉ lấy số, ví dụ: 208, 395, 340).
2. originalInvoiceDate: Ngày lập hóa đơn trên ảnh (định dạng DD/MM/YYYY, ví dụ: 11/09/2026).
3. sellerName: Tên đơn vị bán hàng (rút gọn chuẩn như: 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế').
4. productName: Tên mặt hàng hóa (ví dụ: 'Tôm Thẻ Chân Trắng Cỡ 30 Con/Kg').
5. weight: Trọng lượng thực tế tính bằng kg. LƯU Ý QUAN TRỌNG: Hãy lấy số kg thực từ cột 'Số lượng' (ví dụ 5.753,1 thì đổi thành 5753.1). KHÔNG lấy từ cột 'Trọng lượng' nếu cột đó ghi số 0.
6. unitPrice: Đơn giá mỗi kg dạng số nguyên (ví dụ: 177000, 192000).
7. totalAmount: Thành tiền chưa thuế dạng số nguyên (ví dụ: 1018298700).

Chỉ trả về duy nhất một chuỗi JSON hợp lệ không có markdown code fence:
{
  "invoiceNumber": 208,
  "originalInvoiceDate": "11/09/2026",
  "sellerName": "Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế",
  "productName": "Tôm Thẻ Chân Trắng Cỡ 30 Con/Kg",
  "weight": 5753.1,
  "unitPrice": 177000,
  "totalAmount": 1018298700
}`;

  const CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let textContent = '';
  let lastError = '';

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        textContent = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (textContent) {
          break; // Thành công
        }
      } else {
        const errorText = await response.text();
        lastError = `Model ${model} (${response.status}): ${errorText}`;
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
    }
  }

  if (!textContent) {
    throw new Error(`Gemini API không thể xử lý ảnh: ${lastError}`);
  }

  // Parse JSON
  const cleaned = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const weightNum = parseVietnameseNumber(parsed.weight);
  const priceNum = parseVietnameseNumber(parsed.unitPrice);
  const totalNum = parseVietnameseNumber(parsed.totalAmount) || Math.round(weightNum * priceNum);

  return {
    invoiceNumber: parsed.invoiceNumber || '',
    originalInvoiceDate: parsed.originalInvoiceDate || '',
    appliedDate: creationDate,
    sellerName: normalizeSellerName(parsed.sellerName),
    productName: parsed.productName || 'Tôm Thẻ Chân Trắng',
    weight: weightNum,
    unitPrice: priceNum,
    totalAmount: totalNum,
    status: 'done',
  };
}

function normalizeSellerName(name?: string): string {
  if (!name) return 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế';
  let clean = name.trim();
  clean = clean.replace(/Chi nhánh/gi, 'CN');
  clean = clean.replace(/^Công ty/gi, 'Cty');
  return clean;
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
