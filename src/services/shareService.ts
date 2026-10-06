import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export function downloadWebFile(fileUri: string, fileName: string) {
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = fileUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Chuyển tên file tiếng Việt có dấu thành ASCII an toàn (không dấu, gạch dưới).
 * Bắt buộc đối với Web Share API trên Android và iOS để không bị hệ điều hành từ chối file.
 */
export function sanitizeFilename(name: string): string {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : 'xlsx';
  const base = parts.join('.');

  const asciiBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ toàn bộ dấu tiếng Việt
    .replace(/[đ]/g, 'd')
    .replace(/[Đ]/g, 'D')
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // Thay ký tự lạ và khoảng trắng bằng gạch dưới
    .replace(/_+/g, '_')              // Gộp các gạch dưới liên tiếp
    .replace(/^_|_$/g, '');           // Cắt gạch dưới đầu/cuối

  return `${asciiBase || 'BANG_KE_HOA_DON'}.${ext}`;
}

export async function shareExcelFile(
  fileUri: string,
  fileName: string,
  rawBytes?: Uint8Array
): Promise<boolean> {
  try {
    // 1. Nếu đang chạy trên Trình duyệt Web (Safari iPhone, Chrome Android, Desktop...)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const nav = navigator as any;

      if (typeof nav.share === 'function' && rawBytes) {
        const safeName = sanitizeFilename(fileName);

        // Danh sách các tổ hợp tên file và MIME type để thử nghiệm tương thích tối đa
        const candidateNames = [safeName, fileName];
        const candidateMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
          '',
        ];

        let fileToShare: File | null = null;

        for (const name of candidateNames) {
          for (const mime of candidateMimeTypes) {
            try {
              const testFile = new File([rawBytes as any], name, { type: mime });
              if (typeof nav.canShare === 'function') {
                // QUAN TRỌNG: CHỈ chia sẻ files (không kèm title/text).
                // Nếu truyền kèm title hoặc text trên Android, Zalo và Messages
                // sẽ ưu tiên gửi nội dung text thay vì đính kèm tệp tin Excel thực tế!
                if (nav.canShare({ files: [testFile] })) {
                  fileToShare = testFile;
                  break;
                }
              } else {
                fileToShare = testFile;
                break;
              }
            } catch {
              // Tiếp tục thử tổ hợp khác
            }
          }
          if (fileToShare) break;
        }

        if (fileToShare) {
          try {
            await nav.share({
              files: [fileToShare],
            });
            return true;
          } catch (shareErr: any) {
            // Người dùng bấm "Hủy" hoặc vuốt tắt bảng chia sẻ của hệ thống
            if (shareErr?.name === 'AbortError') {
              return false;
            }
            console.warn('Web Share API bị chặn hoặc gặp lỗi, chuyển sang tải về:', shareErr);
          }
        }
      }

      // 2. Dự phòng khi trình duyệt không hỗ trợ Web Share API (Desktop, Zalo in-app webview...)
      downloadWebFile(fileUri, fileName);

      const userAgent = navigator.userAgent || '';
      const isZalo = /Zalo/i.test(userAgent);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);

      if (isZalo) {
        Alert.alert(
          'Đã tải file Excel về máy',
          `File "${fileName}" đã được tải về máy thành công!\n\n💡 Bạn đang mở web trong Zalo (trình duyệt trong Zalo không hỗ trợ mở bảng chia sẻ trực tiếp).\n\n👉 Để gửi file:\n1. Mở cuộc trò chuyện Zalo cần gửi\n2. Bấm biểu tượng 📎 (Đính kèm) ➔ Chọn File\n3. Chọn file vừa tải trong mục 'Tải về' để gửi ngay.\n\n💡 Mẹo: Bấm nút 3 chấm (...) góc trên màn hình ➔ 'Mở bằng trình duyệt' (Chrome) để mở bảng chia sẻ trực tiếp!`
        );
      } else if (isMobile) {
        Alert.alert(
          'Đã tải file Excel về máy',
          `File "${fileName}" đã được tải về máy thành công!\n\n💡 Trình duyệt hiện tại chưa hỗ trợ bật trực tiếp bảng chia sẻ tệp.\n\n👉 Để gửi qua Zalo / Tin nhắn:\n1. Mở Zalo ➔ Vào cuộc trò chuyện cần gửi\n2. Bấm biểu tượng 📎 (Đính kèm) ➔ Chọn File\n3. Chọn file vừa tải trong mục 'Tải về' để gửi ngay.`
        );
      } else {
        Alert.alert(
          'Đã xuất file thành công',
          `File "${fileName}" đã được lưu tại thư mục Tải về (Downloads) trên máy tính!`
        );
      }
      return true;
    }

    // 3. Nếu đang chạy trên ứng dụng Native (Expo Go / file APK Android)
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Thông báo',
        'Tính năng chia sẻ không khả dụng trên môi trường này. File đã được lưu tại: ' + fileUri
      );
      return false;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Chia sẻ ${fileName} qua Zalo, Tin nhắn...`,
      UTI: 'com.microsoft.excel.openxml_workbook',
    });
    return true;
  } catch (error: any) {
    if (error?.name === 'AbortError') return false;
    console.error('Lỗi khi chia sẻ file:', error);
    Alert.alert('Lỗi chia sẻ', error?.message || 'Không thể mở trình chia sẻ.');
    return false;
  }
}
