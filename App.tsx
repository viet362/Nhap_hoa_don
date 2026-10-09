import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvoiceItem, ExportSettings, sortInvoicesAscending } from './src/types/invoice';
import { Header } from './src/components/Header';
import { ImagePickerSection } from './src/components/ImagePickerSection';
import { InvoiceTable } from './src/components/InvoiceTable';
import { ExportShareBar } from './src/components/ExportShareBar';
import { ApiKeyModal } from './src/components/ApiKeyModal';
import { ConfirmModal } from './src/components/ConfirmModal';
import { AppShareModal } from './src/components/AppShareModal';
import { ScreenPetCat } from './src/components/ScreenPetCat';
import { CatQuoteModal } from './src/components/CatQuoteModal';
import {
  getLocalQuotes,
  getCatEnabled,
  setCatEnabled,
  syncQuotesWithAiven,
} from './src/services/catQuoteService';
import {
  getStoredApiKeys,
  saveStoredApiKeys,
  extractInvoiceWithGemini,
} from './src/services/geminiService';
import { generateInvoiceExcel } from './src/services/excelService';
import { shareExcelFile, downloadWebFile } from './src/services/shareService';

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
    decimalSeparator: 'auto',    // Mặc định: Tự động theo máy
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [backupApiKey, setBackupApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCatSettingsOpen, setIsCatSettingsOpen] = useState(false);
  const [isCatEnabled, setIsCatEnabled] = useState(true);
  const [catQuotes, setCatQuotes] = useState<string[]>([]);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [exportedFileName, setExportedFileName] = useState('');
  const [exportedFileUri, setExportedFileUri] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Tải API Key và Cấu hình đã lưu từ trước
  useEffect(() => {
    (async () => {
      const { primaryKey, backupKey } = await getStoredApiKeys();
      if (primaryKey) setApiKey(primaryKey);
      if (backupKey) setBackupApiKey(backupKey);

      try {
        const storedSep = await AsyncStorage.getItem('@export_decimal_separator');
        if (storedSep === 'auto' || storedSep === 'comma' || storedSep === 'dot') {
          setSettings((prev) => ({ ...prev, decimalSeparator: storedSep }));
        }
      } catch (e) {
        console.warn('Lỗi đọc cấu hình dấu thập phân:', e);
      }

      // Tải cài đặt mèo hoạt hình & tự động đồng bộ Aiven MySQL
      getLocalQuotes().then(setCatQuotes);
      getCatEnabled().then(setIsCatEnabled);
      syncQuotesWithAiven().then((res) => {
        if (res.quotes && res.quotes.length > 0) {
          setCatQuotes(res.quotes);
        }
      }).catch(() => {});
    })();
  }, []);

  // Xử lý khi chọn ảnh mới từ thư viện hoặc camera
  const handleImagesSelected = async (uris: string[]) => {
    if (uris.length === 0) return;

    if (!apiKey && !backupApiKey) {
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

    try {
      for (let i = 0; i < uris.length; i++) {
        setProcessingStatus(`Đang đọc ảnh ${i + 1}/${uris.length}...`);
        try {
          const extracted = await extractInvoiceWithGemini(
            uris[i],
            apiKey,
            settings.creationDate,
            (status) => setProcessingStatus(`Ảnh ${i + 1}/${uris.length}: ${status}`),
            backupApiKey
          );
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

        // Giãn cách 800ms giữa các ảnh để bảo đảm không bị nghẽn giới hạn gọi API (Rate Limit)
        if (i < uris.length - 1) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      setItems((prev) => sortInvoicesAscending([...prev, ...newItems]));
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Cập nhật cấu hình bảng kê (ngày tạo, tùy chọn ngày, dấu thập phân)
  const handleUpdateSettings = (updates: Partial<ExportSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    if (updates.decimalSeparator) {
      AsyncStorage.setItem('@export_decimal_separator', updates.decimalSeparator).catch((e) => {
        console.warn('Không thể lưu cấu hình dấu thập phân:', e);
      });
    }
  };

  // Sửa một dòng hóa đơn (tự động giữ thứ tự tăng dần)
  const handleUpdateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems((prev) =>
      sortInvoicesAscending(
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    );
  };

  // Xóa một dòng hóa đơn
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Xóa toàn bộ danh sách (Mở Modal xác nhận trong ứng dụng, hoạt động 100% trên mọi nền tảng)
  const handleClearAll = () => {
    setIsConfirmClearOpen(true);
  };

  const handleConfirmClearAll = () => {
    setItems([]);
    setIsConfirmClearOpen(false);
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
      setExportedFileName(fileName);
      setExportedFileUri(fileUri);

      // 2. Nếu đang chạy trên Native App (Expo Go / APK Android): Dùng Native Sharing của hệ điều hành
      if (Platform.OS !== 'web') {
        await shareExcelFile(fileUri, fileName, rawBytes);
      } else {
        // Trên Web di động:
        // Tự động tải file về máy và mở Bảng chọn ứng dụng (Zalo, Tin nhắn, Gmail, Telegram...)
        downloadWebFile(fileUri, fileName);
        setIsShareModalOpen(true);
      }
    } catch (err: any) {
      Alert.alert('Lỗi xuất file', err?.message || 'Không thể tạo file Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRedownload = () => {
    if (exportedFileUri && exportedFileName) {
      downloadWebFile(exportedFileUri, exportedFileName);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Header thanh điều hướng */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCatSettings={() => setIsCatSettingsOpen(true)}
          hasApiKey={Boolean(apiKey || backupApiKey)}
          catEnabled={isCatEnabled}
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

        {/* Modal cấu hình API Key với hỗ trợ bảo mật & 2 Key dự phòng */}
        <ApiKeyModal
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          backupApiKey={backupApiKey}
          onSave={(primaryKey, backupKey) => {
            setApiKey(primaryKey);
            setBackupApiKey(backupKey);
            saveStoredApiKeys(primaryKey, backupKey);
          }}
        />

        {/* Modal xác nhận xóa toàn bộ danh sách (100% in-app UI) */}
        <ConfirmModal
          visible={isConfirmClearOpen}
          title="Xóa toàn bộ hóa đơn?"
          message="Bạn có chắc chắn muốn xóa tất cả hóa đơn đang có trong bảng kê? Dữ liệu này sẽ không thể khôi phục."
          confirmText="Xác nhận xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmClearAll}
          onCancel={() => setIsConfirmClearOpen(false)}
        />

        {/* Modal bảng chọn ứng dụng gửi file (Zalo, Tin nhắn, Gmail, Telegram, Messenger, Viber...) */}
        <AppShareModal
          visible={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          fileName={exportedFileName || `BẢNG KÊ HÀNG HÓA MUA VÀO NGÀY ${settings.fileNameDate}.xlsx`}
          itemCount={items.length}
          onRedownload={handleRedownload}
        />

        {/* Chú mèo Lottie hoạt hình đi lại ngẫu nhiên */}
        <ScreenPetCat
          quotes={catQuotes}
          enabled={isCatEnabled}
          onOpenSettings={() => setIsCatSettingsOpen(true)}
        />

        {/* Modal quản lý câu nói chú mèo & đồng bộ Aiven MySQL */}
        <CatQuoteModal
          visible={isCatSettingsOpen}
          onClose={() => setIsCatSettingsOpen(false)}
          isEnabled={isCatEnabled}
          onToggleEnabled={(val) => {
            setIsCatEnabled(val);
            setCatEnabled(val);
          }}
          quotes={catQuotes}
          onQuotesUpdated={setCatQuotes}
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
