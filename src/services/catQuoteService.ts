import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CatQuoteItem {
  id?: number | string;
  content: string;
}

const STORAGE_CAT_QUOTES = '@cat_quotes_list';
const STORAGE_CAT_ENABLED = '@cat_companion_enabled';
const STORAGE_SYNC_API_URL = '@cat_quotes_api_url';

export const DEFAULT_CAT_QUOTES: string[] = [
  'Hôm nay làm việc năng suất nha vợ! 🐾',
  'Nhớ uống nước và chớp mắt nghỉ ngơi chút nhé! ☕',
  'Cố lên nào, mọi việc rồi sẽ qua thôi! 🎉',
  'Meo meo~ Đừng làm việc quá sức nha! 🐱',
  'Vợ là người tuyệt vời nhất! ✨',
  'Chúc vợ một ngày làm việc tràn đầy năng lượng! ☀️'
];

export async function getLocalQuotes(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CAT_QUOTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc quotes từ AsyncStorage:', e);
  }
  // Nếu chưa có, lưu mặc định
  await saveLocalQuotes(DEFAULT_CAT_QUOTES);
  return DEFAULT_CAT_QUOTES;
}

export async function saveLocalQuotes(quotes: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_CAT_QUOTES, JSON.stringify(quotes));
  } catch (e) {
    console.error('Không thể lưu quotes vào AsyncStorage:', e);
  }
}

export async function getCatEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CAT_ENABLED);
    return raw !== 'false'; // Mặc định là bật (true)
  } catch {
    return true;
  }
}

export async function setCatEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_CAT_ENABLED, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Lỗi lưu trạng thái mèo:', e);
  }
}

export async function getSyncApiUrl(): Promise<string> {
  try {
    const url = await AsyncStorage.getItem(STORAGE_SYNC_API_URL);
    return url || '/api/cat-quotes';
  } catch {
    return '/api/cat-quotes';
  }
}

export async function setSyncApiUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_SYNC_API_URL, url.trim());
  } catch (e) {
    console.error('Lỗi lưu URL API đồng bộ:', e);
  }
}

/**
 * Đồng bộ hai chiều với Aiven MySQL qua Netlify Function
 */
export async function syncQuotesWithAiven(): Promise<{
  success: boolean;
  quotes: string[];
  connected: boolean;
  message: string;
}> {
  const local = await getLocalQuotes();
  const apiUrl = await getSyncApiUrl();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.connected && Array.isArray(data.quotes) && data.quotes.length > 0) {
        const cloudQuotes = data.quotes.map((q: any) =>
          typeof q === 'string' ? q : q.content
        ).filter(Boolean);

        // Hợp nhất danh sách đám mây và lưu cục bộ
        const merged = Array.from(new Set([...cloudQuotes, ...local]));
        await saveLocalQuotes(merged);

        return {
          success: true,
          quotes: merged,
          connected: true,
          message: `Đồng bộ thành công ${cloudQuotes.length} câu từ Aiven MySQL!`,
        };
      } else if (data.connected && Array.isArray(data.quotes) && data.quotes.length === 0) {
        // Database mới tinh chưa có dữ liệu -> đẩy các câu mẫu lên Aiven
        for (const q of local) {
          await pushQuoteToCloud(apiUrl, q).catch(() => { });
        }
        return {
          success: true,
          quotes: local,
          connected: true,
          message: 'Đã kết nối Aiven MySQL và khởi tạo kho câu nói dùng chung!',
        };
      } else {
        return {
          success: false,
          quotes: local,
          connected: false,
          message: data.message || 'Chưa thiết lập biến môi trường Aiven MySQL trên máy chủ.',
        };
      }
    } else {
      return {
        success: false,
        quotes: local,
        connected: false,
        message: `Máy chủ phản hồi HTTP ${res.status}. Sử dụng danh sách cục bộ.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      quotes: local,
      connected: false,
      message: 'Không thể kết nối API đồng bộ (Dùng bộ nhớ máy): ' + (err?.message || ''),
    };
  }
}

/**
 * Gửi thêm 1 câu lên đám mây Aiven MySQL
 */
export async function pushQuoteToCloud(apiUrl: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Xóa 1 câu trên đám mây Aiven MySQL
 */
export async function deleteQuoteFromCloud(apiUrl: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
