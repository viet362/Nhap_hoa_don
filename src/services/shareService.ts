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
        const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (rawBytes) {
          file = new File([rawBytes as any], fileName, { type: mimeType });
        } else if (fileUri.startsWith('blob:')) {
          const res = await fetch(fileUri);
          const blob = await res.blob();
          file = new File([blob], fileName, { type: mimeType });
        }

        // Kiểm tra trình duyệt có hỗ trợ gửi FILE thực tế không (Web Share API Level 2)
        if (file && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({
            files: [file],
            title: fileName,
          });
          return true;
        }
      } catch (err: any) {
        // Nếu người dùng bấm "Hủy" chia sẻ trên màn hình điện thoại thì không báo lỗi
        if (err.name === 'AbortError') {
          return false;
        }
        console.warn('Không thể chia sẻ file qua Web Share API, chuyển sang tải về:', err);
      }

      // Nếu trình duyệt không hỗ trợ chia sẻ file trực tiếp (ví dụ trên máy tính Desktop):
      downloadWebFile(fileUri, fileName);
      Alert.alert('Đã xuất Excel', `File "${fileName}" đã được tải về máy của bạn thành công!`);
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
