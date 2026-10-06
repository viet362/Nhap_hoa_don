import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export async function shareExcelFile(fileUri: string, fileName: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: fileName,
          text: `Bảng kê hóa đơn: ${fileName}`,
        });
        return true;
      } catch {
        return true;
      }
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Đã xuất Excel',
        `File "${fileName}" đã được tải về máy thành công!`
      );
      return true;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Chia sẻ ${fileName} qua Zalo, Tin nhắn...`,
      UTI: 'com.microsoft.excel.openxml_workbook',
    });
    return true;
  } catch (error: any) {
    console.error('Lỗi khi chia sẻ file:', error);
    Alert.alert('Lỗi chia sẻ', error?.message || 'Không thể mở trình chia sẻ.');
    return false;
  }
}
