import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { InvoiceItem, ExportSettings } from './src/types/invoice';
import { Header } from './src/components/Header';
import { ImagePickerSection } from './src/components/ImagePickerSection';
import { InvoiceTable } from './src/components/InvoiceTable';
import { ExportShareBar } from './src/components/ExportShareBar';
import { ApiKeyModal } from './src/components/ApiKeyModal';
import {
  getStoredApiKey,
  saveStoredApiKey,
  extractInvoiceWithGemini,
} from './src/services/geminiService';
import { generateInvoiceExcel } from './src/services/excelService';
import { shareExcelFile } from './src/services/shareService';

// Khởi tạo ngày hôm nay theo định dạng chuẩn
function getTodayFormats() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(-2);

  return {
    creationDate: `${dd}/${mm}/${yyyy}`,
    fileNameDate: `${dd}.${mm}.${yy}`,
  };
}

export default function App() {
  const { creationDate, fileNameDate } = getTodayFormats();

  const [settings, setSettings] = useState<ExportSettings>({
    creationDate,
    fileNameDate,
    useCreationDateForAll: true, // Mặc định: Thay ngày trên cột F bằng ngày tạo
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Tải API Key đã lưu từ trước
  useEffect(() => {
    (async () => {
      const stored = await getStoredApiKey();
      if (stored) setApiKey(stored);
    })();
  }, []);

  // Xử lý khi chọn ảnh mới từ thư viện hoặc camera
  const handleImagesSelected = async (uris: string[]) => {
    if (uris.length === 0) return;

    if (!apiKey) {
      Alert.alert(
        'Chưa có API Key',
        'Để phân tích hóa đơn tự động bằng AI, bạn cần nhập Gemini API Key trong cài đặt (⚙️) ở góc trên bên phải.',
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Mở Cài đặt', onPress: () => setIsSettingsOpen(true) },
        ]
      );
      return;
    }

    setIsProcessing(true);
    const newItems: InvoiceItem[] = [];

    for (let i = 0; i < uris.length; i++) {
      setProcessingStatus(`Đang đọc ảnh ${i + 1}/${uris.length}...`);
      try {
        const extracted = await extractInvoiceWithGemini(uris[i], apiKey, settings.creationDate);
        newItems.push({
          id: `item-${Date.now()}-${i}`,
          invoiceNumber: extracted.invoiceNumber || `HĐ-${i + 1}`,
          originalInvoiceDate: extracted.originalInvoiceDate || settings.creationDate,
          appliedDate: settings.creationDate,
          sellerName: extracted.sellerName || 'Cty TNHH Thuỷ sản Công nghệ cao Việt Nam - CN 1 tại Huế',
          productName: extracted.productName || 'Tôm Thẻ Chân Trắng',
          weight: extracted.weight || 0,
          unitPrice: extracted.unitPrice || 0,
          totalAmount: extracted.totalAmount || 0,
          imageUri: uris[i],
          status: 'done',
        });
      } catch (err: any) {
        console.error('Lỗi khi bóc tách ảnh:', err);
        newItems.push({
          id: `item-${Date.now()}-${i}`,
          invoiceNumber: `Lỗi-${i + 1}`,
          originalInvoiceDate: settings.creationDate,
          appliedDate: settings.creationDate,
          sellerName: 'Không nhận diện được',
          productName: 'Vui lòng kiểm tra lại ảnh',
          weight: 0,
          unitPrice: 0,
          totalAmount: 0,
          imageUri: uris[i],
          status: 'error',
          errorMessage: err?.message,
        });
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
    setProcessingStatus('');
  };

  // Cập nhật cấu hình bảng kê (ngày tạo, tùy chọn ngày)
  const handleUpdateSettings = (updates: Partial<ExportSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Sửa một dòng hóa đơn
  const handleUpdateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Xóa một dòng hóa đơn
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Xóa toàn bộ danh sách
  const handleClearAll = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa toàn bộ danh sách hóa đơn hiện tại?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa tất cả', style: 'destructive', onPress: () => setItems([]) },
    ]);
  };

  // Xuất file Excel và KÍCH HOẠT NÚT CHIA SẺ SANG ZALO, TIN NHẮN...
  const handleExportAndShare = async () => {
    if (items.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng thêm ít nhất 1 hóa đơn trước khi xuất.');
      return;
    }

    try {
      setIsExporting(true);
      // 1. Tạo file Excel chuẩn 100% định dạng mẫu
      const { fileUri, fileName, rawBytes } = await generateInvoiceExcel(items, settings);

      // 2. Kích hoạt Native Share Sheet (Zalo, Tin nhắn, Mail, AirDrop)
      setIsExporting(false);
      await shareExcelFile(fileUri, fileName, rawBytes);
    } catch (err: any) {
      setIsExporting(false);
      Alert.alert('Lỗi xuất file', err?.message || 'Không thể tạo file Excel.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Header thanh điều hướng */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          hasApiKey={Boolean(apiKey)}
        />

        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
          {/* Khu vực chọn ảnh & chụp ảnh */}
          <ImagePickerSection
            onImagesSelected={handleImagesSelected}
            isLoading={isProcessing}
            itemCount={items.length}
          />

          {/* Thanh trạng thái xử lý AI */}
          {isProcessing && (
            <View style={styles.processingBanner}>
              <ActivityIndicator color="#38BDF8" size="small" />
              <Text style={styles.processingText}>{processingStatus || 'Đang xử lý ảnh...'}</Text>
            </View>
          )}

          {/* Bảng chi tiết hóa đơn */}
          <InvoiceTable
            items={items}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onClearAll={handleClearAll}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Nút hành động cố định phía dưới: XUẤT & CHIA SẺ QUA ZALO, TIN NHẮN */}
        <ExportShareBar
          onExportAndShare={handleExportAndShare}
          isExporting={isExporting}
          itemCount={items.length}
          fileNameDate={settings.fileNameDate}
        />

        {/* Modal cấu hình API Key */}
        <ApiKeyModal
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          onSave={(key) => {
            setApiKey(key);
            saveStoredApiKey(key);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A', // Nền tối hiện đại sang trọng
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  processingText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
