const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readThreeDigits(n: number, isHighest: boolean): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const res: string[] = [];

  if (h > 0 || !isHighest) {
    res.push(DIGITS[h] + ' trăm');
  }

  if (t > 1) {
    res.push(DIGITS[t] + ' mươi');
    if (u === 1) res.push('mốt');
    else if (u === 4) res.push('bốn'); // Trong file mẫu kế toán thực tế dùng "bốn mươi bốn"
    else if (u === 5) res.push('lăm');
    else if (u > 0) res.push(DIGITS[u]);
  } else if (t === 1) {
    res.push('mười');
    if (u === 5) res.push('lăm');
    else if (u > 0) res.push(DIGITS[u]);
  } else if (t === 0) {
    if (u > 0) {
      if (h > 0 || !isHighest) {
        res.push('linh ' + DIGITS[u]);
      } else {
        res.push(DIGITS[u]);
      }
    }
  }

  return res.join(' ');
}

/**
 * Đọc số tiền nguyên dương thành chữ tiếng Việt chuẩn hóa 100% theo hóa đơn & phiếu thu thực tế:
 * Ví dụ: 49580000 -> "Bốn mươi chín triệu năm trăm tám mươi nghìn đồng chẵn"
 */
export function numberToWordsVietnamese(num: number): string {
  if (!num || isNaN(num) || num <= 0) {
    return 'Không đồng chẵn';
  }

  const chunks: number[] = [];
  let temp = Math.round(num);

  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const c = chunks[i];
    if (c > 0) {
      const isHighest = i === chunks.length - 1;
      const words = readThreeDigits(c, isHighest);
      const scale = SCALES[i];
      parts.push(words + (scale ? ' ' + scale : ''));
    }
  }

  const raw = parts.join(' ').trim();
  if (!raw) return 'Không đồng chẵn';

  return raw.charAt(0).toUpperCase() + raw.slice(1) + ' đồng chẵn';
}
