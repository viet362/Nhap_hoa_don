import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

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

export async function shareExcelFile(
  fileUri: string,
  fileName: string,
  rawBytes?: Uint8Array
): Promise<boolean> {
  try {
    // 1. Nếu đang chạy trên Trình duyệt Web (Safari iPhone, Chrome Android, Desktop...)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        let file: File | null = null;
        const candidateMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
        ];

        // Tìm MIME type được trình duyệt chấp nhận chia sẻ
        for (const mime of candidateMimeTypes) {
          try {
            const testFile = rawBytes
              ? new File([rawBytes as any], fileName, { type: mime })
              : null;
            if (testFile) {
              if ((navigator as any).canShare) {
                if ((navigator as any).canShare({ files: [testFile] })) {
                  file = testFile;
                  break;
                }
              } else {
                file = testFile;
                break;
              }
            }
          } catch (e) {
            // bỏ qua
          }
        }

        if (!file && rawBytes) {
          file = new File([rawBytes as any], fileName, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
        }

        if (file) {
          await (navigator as any).share({
            files: [file],
            title: fileName,
          });
          return true;
        }
      } catch (err: any) {
        // Nếu người dùng bấm "Hủy" chia sẻ trên màn hình điện thoại thì không làm gì cả
        if (err.name === 'AbortError') {
          return false;
        }
        console.warn('Web Share API không khả dụng hoặc bị chặn, chuyển sang tải về:', err);
      }

      // Nếu trình duyệt không hỗ trợ chia sẻ file trực tiếp (ví dụ Desktop hoặc trình duyệt trong ứng dụng):
      downloadWebFile(fileUri, fileName);
      Alert.alert(
        'Đã tải file Excel về máy',
        `File "${fileName}" đã được tải về máy thành công!\n\n💡 Để gửi qua Zalo: Bạn chỉ cần mở Zalo ➔ Bấm nút đính kèm 📎 ➔ Chọn file vừa tải để gửi ngay.`
      );
      return true;
    }

    // 2. Nếu đang chạy trên ứng dụng Native (Expo Go / file APK Android)
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
