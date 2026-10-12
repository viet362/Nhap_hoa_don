import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import {
  ReceiptItem,
  ReceiptConfig,
  DEFAULT_RECEIPT_CONFIG,
  ReceiptProcessResult,
} from '../types/receipt';
import {
  readWorkbook,
  extractSheetReceiptItems,
  generateReceiptsDocx,
} from '../services/receiptDocxService';
import { shareDocxFile, downloadWebFile } from '../services/shareService';
import { ReceiptResultModal } from './ReceiptResultModal';
import { SheetDataPickerModal } from './SheetDataPickerModal';

export const ReceiptGeneratorTab: React.FC = () => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  const [allItemsInSheet, setAllItemsInSheet] = useState<ReceiptItem[]>([]);
  const [startInput, setStartInput] = useState<string>('');
  const [endInput, setEndInput] = useState<string>('');
  const [showPreviewList, setShowPreviewList] = useState<boolean>(false);

  // Điều hướng cuộn thanh Sheet (Mũi tên & Giữ/Kéo/Trượt)
  const sheetScrollRef = useRef<ScrollView>(null);
  const scrollXRef = useRef<number>(0);
  const [scrollX, setScrollX] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [contentWidth, setContentWidth] = useState<number>(0);
  const scrollHoldTimer = useRef<any>(null);

  // Kéo chuột để trượt trên Web
  const isDraggingMouse = useRef<boolean>(false);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const isDragMoved = useRef<boolean>(false);
  const mouseStartX = useRef<number>(0);
  const mouseScrollStartX = useRef<number>(0);

  const [config, setConfig] = useState<ReceiptConfig>(DEFAULT_RECEIPT_CONFIG);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const [isSheetPickerVisible, setIsSheetPickerVisible] = useState<boolean>(false);
  const [resultModalVisible, setResultModalVisible] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ReceiptProcessResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Đọc buffer file Excel: Mặc định chọn Sheet đầu tiên trong Workbook
  const handleLoadExcelData = (data: ArrayBuffer | Uint8Array | string, name: string) => {
    try {
      setIsProcessing(true);
      setProcessingStatus('Đang mở file Excel...');
      const wb = readWorkbook(data);
      setWorkbook(wb);
      setFileName(name);
      setSheetNames(wb.SheetNames);

      // Mặc định chọn sheet đầu tiên 100%
      const defaultSheet = wb.SheetNames[0] || '';
      setSelectedSheet(defaultSheet);
    } catch (err: any) {
      Alert.alert('Lỗi đọc file', err?.message || 'File Excel không đúng định dạng hoặc bị lỗi.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Hỗ trợ Kéo & Thả file từ máy tính (Desktop Drag & Drop)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDraggingFile(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingFile(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (
          file.name.toLowerCase().endsWith('.xlsx') ||
          file.name.toLowerCase().endsWith('.xls')
        ) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const buf = evt.target?.result as ArrayBuffer;
            if (buf) handleLoadExcelData(buf, file.name);
          };
          reader.readAsArrayBuffer(file);
        } else {
          Alert.alert(
            'Định dạng không hỗ trợ',
            'Vui lòng kéo thả file Excel có đuôi .xlsx hoặc .xls.'
          );
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Hỗ trợ Kéo & Trượt chuột toàn màn hình cho thanh Sheet trên Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingMouse.current) return;
      const diff = e.clientX - mouseStartX.current;
      if (Math.abs(diff) > 4) {
        isDragMoved.current = true;
      }
      const maxScroll = Math.max(0, contentWidth - containerWidth);
      const targetX = Math.max(0, Math.min(maxScroll, mouseScrollStartX.current - diff));
      scrollXRef.current = targetX;
      setScrollX(targetX);
      sheetScrollRef.current?.scrollTo({ x: targetX, animated: false });
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingMouse.current) {
        isDraggingMouse.current = false;
        setIsDraggingActive(false);
        setTimeout(() => {
          isDragMoved.current = false;
        }, 60);
      }
      if (scrollHoldTimer.current) {
        clearInterval(scrollHoldTimer.current);
        scrollHoldTimer.current = null;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [contentWidth, containerWidth]);

  // Xử lý khi chọn Sheet mới -> Tự động điền mặc định từ dòng đầu đến hết
  useEffect(() => {
    if (workbook && selectedSheet) {
      try {
        const items = extractSheetReceiptItems(workbook, selectedSheet);
        setAllItemsInSheet(items);

        if (items.length > 0) {
          // Mặc định thực tế: Bắt đầu từ số đầu tiên và kết thúc ở số cuối cùng của sheet
          setStartInput(items[0].cleanInvoiceNumber);
          setEndInput(items[items.length - 1].cleanInvoiceNumber);
        } else {
          setStartInput('');
          setEndInput('');
        }
      } catch (err) {
        console.error('Lỗi khi đọc sheet:', err);
        Alert.alert('Lỗi đọc sheet', 'Không thể trích xuất dữ liệu từ sheet đã chọn.');
      }
    } else {
      setAllItemsInSheet([]);
      setStartInput('');
      setEndInput('');
    }
  }, [workbook, selectedSheet]);

  // Điều khiển cuộn danh sách Sheet bằng mũi tên
  const handleScrollStep = (direction: 'left' | 'right', step = 180) => {
    const delta = direction === 'left' ? -step : step;
    const maxScroll = Math.max(0, contentWidth - containerWidth);
    const targetX = Math.max(0, Math.min(maxScroll, scrollXRef.current + delta));
    scrollXRef.current = targetX;
    setScrollX(targetX);
    sheetScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const handleStartHoldScroll = (direction: 'left' | 'right') => {
    handleScrollStep(direction, 140);
    if (scrollHoldTimer.current) clearInterval(scrollHoldTimer.current);
    scrollHoldTimer.current = setInterval(() => {
      handleScrollStep(direction, 90);
    }, 70);
  };

  const handleStopHoldScroll = () => {
    if (scrollHoldTimer.current) {
      clearInterval(scrollHoldTimer.current);
      scrollHoldTimer.current = null;
    }
  };

  // Bắt đầu kéo chuột để trượt trên Web Desktop
  const onMouseDownTrack = (e: any) => {
    if (Platform.OS !== 'web') return;
    isDraggingMouse.current = true;
    setIsDraggingActive(true);
    isDragMoved.current = false;
    mouseStartX.current = e.clientX || 0;
    mouseScrollStartX.current = scrollXRef.current;
  };

  // Khi số lượng sheet bị tràn thì hiện mũi tên 2 bên
  const isOverflowingSheets =
    contentWidth > 0 && containerWidth > 0
      ? contentWidth > containerWidth + 4
      : sheetNames.length > 3;
  const canScrollLeft = scrollX > 4;
  const canScrollRight = scrollX + containerWidth < contentWidth - 4;

  // Hàm tìm vị trí dòng của số hóa đơn trong Sheet
  const findItemIndex = (query: string): number => {
    if (!query || !query.trim()) return -1;
    const cleanQ = query.trim().replace(/^0+/, '') || query.trim();
    const rawQ = query.trim();

    return allItemsInSheet.findIndex(
      (it) =>
        it.cleanInvoiceNumber === cleanQ ||
        it.rawInvoiceNumber === rawQ ||
        it.cleanInvoiceNumber === rawQ ||
        parseInt(it.cleanInvoiceNumber, 10) === parseInt(cleanQ, 10)
    );
  };

  // Xác thực kiểm tra số người dùng nhập
  const startRowIdx = findItemIndex(startInput);
  const endRowIdx = findItemIndex(endInput);

  let validationError = '';
  if (allItemsInSheet.length > 0) {
    if (!startInput.trim()) {
      validationError = 'Vui lòng nhập số hóa đơn bắt đầu';
    } else if (startRowIdx === -1) {
      validationError = `Không tìm thấy số hóa đơn bắt đầu "${startInput.trim()}" trong Cột A của sheet "${selectedSheet}"`;
    } else if (!endInput.trim()) {
      validationError = 'Vui lòng nhập số hóa đơn kết thúc';
    } else if (endRowIdx === -1) {
      validationError = `Không tìm thấy số hóa đơn kết thúc "${endInput.trim()}" trong Cột A của sheet "${selectedSheet}"`;
    } else if (startRowIdx > endRowIdx) {
      const sClean = allItemsInSheet[startRowIdx]?.cleanInvoiceNumber || startInput;
      const eClean = allItemsInSheet[endRowIdx]?.cleanInvoiceNumber || endInput;
      validationError = `Số bắt đầu (#${sClean}) phải nhỏ hơn hoặc bằng số kết thúc (#${eClean}) theo thứ tự tăng dần`;
    }
  }

  const isValidRange =
    !validationError && startRowIdx !== -1 && endRowIdx !== -1 && startRowIdx <= endRowIdx;

  const selectedItems = isValidRange ? allItemsInSheet.slice(startRowIdx, endRowIdx + 1) : [];
  const invalidItemsCount = selectedItems.filter((it) => it.hasErrors).length;

  // Chọn file trên Web (input file)
  const handleWebFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result as ArrayBuffer;
      if (arrayBuffer) {
        handleLoadExcelData(arrayBuffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Chọn file trên Native qua expo-document-picker
  const handlePickDocument = async () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
      return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setIsProcessing(true);
        setProcessingStatus('Đang đọc file...');
        const base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        handleLoadExcelData(base64Data, asset.name);
      }
    } catch (err: any) {
      Alert.alert('Lỗi chọn file', err?.message || 'Không thể chọn file.');
    }
  };

  // Thực hiện xuất file Word
  const handleGenerateDocx = async () => {
    if (!isValidRange || selectedItems.length === 0) {
      Alert.alert('Không thể xuất', validationError || 'Vui lòng điền đúng khoảng số hóa đơn.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus(`Đang tạo ${selectedItems.length} phiếu thu Word...`);

      const result = await generateReceiptsDocx(selectedItems, config);
      setLastResult(result);

      // Nếu chạy trên Web: Tự động tải về file Word ngay
      if (Platform.OS === 'web') {
        downloadWebFile(result.fileUri, result.fileName);
      }

      setResultModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi tạo phiếu thu', err?.message || 'Không thể tạo file Word.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleShareResult = async () => {
    if (!lastResult) return;
    await shareDocxFile(lastResult.fileUri, lastResult.fileName, lastResult.rawBytes);
  };

  const handleDownloadResult = () => {
    if (!lastResult) return;
    downloadWebFile(lastResult.fileUri, lastResult.fileName);
  };

  return (
    <View style={styles.container}>
      {/* Hidden Web file input */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef as any}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleWebFileSelect}
        />
      )}

      {/* Khu vực Tải File Excel (Hỗ trợ kéo thả trên máy tính) */}
      <View
        style={[
          styles.uploadCard,
          isDraggingFile && styles.uploadCardDragging,
        ]}
      >
        <View style={styles.uploadHeader}>
          <Text style={styles.cardTitle}>1. Chọn File Bảng Kê Doanh Thu Excel</Text>
          <Text style={styles.cardSubtitle}>
            Hỗ trợ kéo thả file .xlsx từ máy tính (chứa Cột A: Hóa đơn, Cột D: Ngày, Cột Q: Tiền)
          </Text>
        </View>

        {workbook ? (
          <View style={styles.fileSelectedBox}>
            <View style={styles.fileInfoRow}>
              <Text style={styles.excelIcon}>📊</Text>
              <View style={styles.fileTextCol}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {fileName}
                </Text>
                <Text style={styles.fileStats}>
                  Có {sheetNames.length} sheet • Đang chọn: {selectedSheet}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.changeFileBtn} onPress={handlePickDocument}>
              <Text style={styles.changeFileBtnText}>Đổi file khác</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.pickButton, isDraggingFile && styles.pickButtonDragging]}
            onPress={handlePickDocument}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            <Text style={styles.pickIcon}>{isDraggingFile ? '📥' : '📁'}</Text>
            <Text style={styles.pickTitle}>
              {isDraggingFile ? 'Thả file Excel vào đây ngay!' : 'Bấm để chọn hoặc kéo thả file Excel (.xlsx)'}
            </Text>
            <Text style={styles.pickDesc}>
              {isDraggingFile
                ? 'Hệ thống sẽ tự động đọc dữ liệu ngay khi bạn thả chuột'
                : 'Kéo thả file trực tiếp từ màn hình máy tính vào ô này'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Thanh trạng thái xử lý */}
      {isProcessing && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator color="#38BDF8" size="small" />
          <Text style={styles.loadingText}>{processingStatus || 'Đang xử lý...'}</Text>
        </View>
      )}

      {/* Khu vực Chọn Sheet & Chọn Khoảng Hóa Đơn */}
      {workbook && (
        <>
          {/* 2. Chọn Sheet (Có mũi tên 2 bên khi tràn, hỗ trợ Giữ/Kéo/Trượt) */}
          <View style={styles.sectionCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sectionTitle}>2. Chọn Sheet Cần Xuất</Text>
              <Text style={styles.sheetCountBadge}>{sheetNames.length} sheet</Text>
            </View>

            <View style={styles.sheetSliderWrapper}>
              {/* Nút mũi tên Trái */}
              {isOverflowingSheets && (
                <TouchableOpacity
                  style={[
                    styles.sheetNavArrow,
                    styles.sheetNavArrowLeft,
                    !canScrollLeft && styles.sheetNavArrowDisabled,
                  ]}
                  onPress={() => handleScrollStep('left')}
                  onPressIn={() => handleStartHoldScroll('left')}
                  onPressOut={handleStopHoldScroll}
                  disabled={!canScrollLeft}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetNavArrowText, !canScrollLeft && styles.sheetNavArrowTextDisabled]}>
                    ◀
                  </Text>
                </TouchableOpacity>
              )}

              {/* Danh sách Sheet cuộn ngang, hỗ trợ chuột giữ/kéo/trượt trên Web */}
              <View
                style={[
                  styles.sheetScrollContainer,
                  Platform.OS === 'web' && ({
                    cursor: isDraggingActive ? 'grabbing' : 'grab',
                    userSelect: 'none',
                  } as any),
                ]}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                // @ts-ignore Web mouse events
                onMouseDown={onMouseDownTrack}
              >
                <ScrollView
                  ref={sheetScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    const x = e.nativeEvent.contentOffset.x;
                    scrollXRef.current = x;
                    setScrollX(x);
                  }}
                  scrollEventThrottle={16}
                  onContentSizeChange={(w) => setContentWidth(w)}
                  contentContainerStyle={styles.sheetScrollContent}
                >
                  {sheetNames.map((name) => {
                    const isSelected = name === selectedSheet;
                    return (
                      <TouchableOpacity
                        key={name}
                        style={[styles.sheetChip, isSelected && styles.sheetChipActive]}
                        onPress={() => {
                          if (isDragMoved.current) return;
                          setSelectedSheet(name);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sheetChipText, isSelected && styles.sheetChipTextActive]}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Nút mũi tên Phải */}
              {isOverflowingSheets && (
                <TouchableOpacity
                  style={[
                    styles.sheetNavArrow,
                    styles.sheetNavArrowRight,
                    !canScrollRight && styles.sheetNavArrowDisabled,
                  ]}
                  onPress={() => handleScrollStep('right')}
                  onPressIn={() => handleStartHoldScroll('right')}
                  onPressOut={handleStopHoldScroll}
                  disabled={!canScrollRight}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetNavArrowText, !canScrollRight && styles.sheetNavArrowTextDisabled]}>
                    ▶
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 3. Người dùng chọn từ số bao nhiêu đến số bao nhiêu */}
          <View style={styles.sectionCard}>
            <View style={styles.indexHeaderRow}>
              <Text style={styles.sectionTitle}>3. Chọn Khoảng Số Hóa Đơn Xuất Phiếu Thu</Text>
              <Text style={styles.indexSubInfo}>
                {allItemsInSheet.length} hóa đơn trong sheet
              </Text>
            </View>

            {allItemsInSheet.length > 0 ? (
              <View style={styles.rangePickerContainer}>
                {/* Nút Mở Bảng Dữ Liệu Sheet để chọn trực quan bằng cách nhấp ô */}
                <TouchableOpacity
                  style={styles.openSheetPickerBtn}
                  onPress={() => setIsSheetPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.openSheetPickerIconBox}>
                    <Text style={styles.openSheetPickerIcon}>📊</Text>
                  </View>
                  <View style={styles.openSheetPickerTextBox}>
                    <Text style={styles.openSheetPickerTitle}>
                      Mở Bảng Dữ Liệu Sheet Để Nhấp Chọn Trực Quan
                    </Text>
                    <Text style={styles.openSheetPickerDesc}>
                      Xem toàn bộ bảng tính và nhấp trực tiếp vào ô để chọn điểm bắt đầu & kết thúc dễ dàng
                    </Text>
                  </View>
                  <View style={styles.openSheetPickerBadgeBox}>
                    <Text style={styles.openSheetPickerBadgeText}>MỞ BẢNG ➔</Text>
                  </View>
                </TouchableOpacity>

                {/* 2 Ô Nhập: Từ số HĐ ... Đến số HĐ ... */}
                <View style={styles.inputRangeRow}>
                  {/* Ô Nhập Bắt Đầu */}
                  <View style={styles.inputCol}>
                    <View style={styles.inputColLabelRow}>
                      <Text style={styles.inputColLabel}>Từ số hóa đơn:</Text>
                      <TouchableOpacity
                        onPress={() => setIsSheetPickerVisible(true)}
                        style={styles.pickLinkBtn}
                      >
                        <Text style={styles.pickLinkText}>📋 Nhấp chọn</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[
                        styles.rangeInput,
                        startRowIdx === -1 && startInput.trim() !== '' && styles.rangeInputError,
                      ]}
                      value={startInput}
                      onChangeText={setStartInput}
                      placeholder={`vd: ${allItemsInSheet[0]?.cleanInvoiceNumber || '1'}`}
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                    {startRowIdx !== -1 ? (
                      <Text style={styles.inputPreviewValid} numberOfLines={1}>
                        ✓ HĐ #{allItemsInSheet[startRowIdx].cleanInvoiceNumber} (
                        {allItemsInSheet[startRowIdx].dateStr || 'Thiếu ngày'} -{' '}
                        {allItemsInSheet[startRowIdx].isAmountValid
                          ? `${allItemsInSheet[startRowIdx].amountFormatted} đ`
                          : 'Thiếu tiền'}
                        )
                      </Text>
                    ) : startInput.trim() !== '' ? (
                      <Text style={styles.inputPreviewError}>❌ Không tìm thấy số này</Text>
                    ) : (
                      <Text style={styles.inputPreviewHint}>Nhập số tại Cột A</Text>
                    )}
                  </View>

                  <Text style={styles.rangeArrow}>➔</Text>

                  {/* Ô Nhập Kết Thúc */}
                  <View style={styles.inputCol}>
                    <View style={styles.inputColLabelRow}>
                      <Text style={styles.inputColLabel}>Đến số hóa đơn:</Text>
                      <TouchableOpacity
                        onPress={() => setIsSheetPickerVisible(true)}
                        style={styles.pickLinkBtn}
                      >
                        <Text style={styles.pickLinkText}>📋 Nhấp chọn</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[
                        styles.rangeInput,
                        endRowIdx === -1 && endInput.trim() !== '' && styles.rangeInputError,
                      ]}
                      value={endInput}
                      onChangeText={setEndInput}
                      placeholder={`vd: ${allItemsInSheet[allItemsInSheet.length - 1]?.cleanInvoiceNumber || '100'}`}
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                    {endRowIdx !== -1 ? (
                      <Text style={styles.inputPreviewValid} numberOfLines={1}>
                        ✓ HĐ #{allItemsInSheet[endRowIdx].cleanInvoiceNumber} (
                        {allItemsInSheet[endRowIdx].dateStr || 'Thiếu ngày'} -{' '}
                        {allItemsInSheet[endRowIdx].isAmountValid
                          ? `${allItemsInSheet[endRowIdx].amountFormatted} đ`
                          : 'Thiếu tiền'}
                        )
                      </Text>
                    ) : endInput.trim() !== '' ? (
                      <Text style={styles.inputPreviewError}>❌ Không tìm thấy số này</Text>
                    ) : (
                      <Text style={styles.inputPreviewHint}>Nhập số tại Cột A</Text>
                    )}
                  </View>
                </View>

                {/* Các nút chọn nhanh: Từ đầu & Đến hết */}
                <View style={styles.quickPresetsRow}>
                  <Text style={styles.quickPresetsLabel}>Chọn nhanh:</Text>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => setStartInput(allItemsInSheet[0].cleanInvoiceNumber)}
                  >
                    <Text style={styles.presetChipText}>
                      ⏮️ Từ đầu (#{allItemsInSheet[0].cleanInvoiceNumber})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() =>
                      setEndInput(allItemsInSheet[allItemsInSheet.length - 1].cleanInvoiceNumber)
                    }
                  >
                    <Text style={styles.presetChipText}>
                      ⏭️ Đến hết (#{allItemsInSheet[allItemsInSheet.length - 1].cleanInvoiceNumber})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Cảnh báo lỗi xác thực hoặc Tóm tắt thành công */}
                {validationError ? (
                  <View style={styles.validationErrorBox}>
                    <Text style={styles.validationErrorIcon}>⚠️</Text>
                    <Text style={styles.validationErrorText}>{validationError}</Text>
                  </View>
                ) : (
                  <View style={styles.summaryBar}>
                    <View style={styles.summaryTextCol}>
                      <Text style={styles.summaryTitle}>
                        Sẽ tạo <Text style={styles.summaryHighlight}>{selectedItems.length}</Text> phiếu
                        thu Word
                      </Text>
                      <Text style={styles.summarySub}>
                        Từ số{' '}
                        <Text style={styles.summaryBold}>
                          #{selectedItems[0]?.cleanInvoiceNumber || '...'}
                        </Text>{' '}
                        đến số{' '}
                        <Text style={styles.summaryBold}>
                          #{selectedItems[selectedItems.length - 1]?.cleanInvoiceNumber || '...'}
                        </Text>
                      </Text>
                    </View>
                    {invalidItemsCount > 0 ? (
                      <View style={styles.warningPill}>
                        <Text style={styles.warningPillText}>
                          ⚠️ {invalidItemsCount} phiếu thiếu ô (sẽ chừa trống điền tay)
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.successPill}>
                        <Text style={styles.successPillText}>✓ 100% hợp lệ</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Nút Xem chi tiết danh sách hóa đơn đã chọn */}
                {isValidRange && selectedItems.length > 0 && (
                  <View style={styles.previewToggleWrapper}>
                    <TouchableOpacity
                      style={styles.previewToggleBtn}
                      onPress={() => setShowPreviewList(!showPreviewList)}
                    >
                      <Text style={styles.previewToggleText}>
                        {showPreviewList ? '▲ Thu gọn danh sách' : `▼ Xem chi tiết ${selectedItems.length} hóa đơn trong khoảng`}
                      </Text>
                    </TouchableOpacity>

                    {showPreviewList && (
                      <ScrollView style={styles.previewListScroll} nestedScrollEnabled>
                        {selectedItems.map((item, idx) => (
                          <View key={item.rawInvoiceNumber || idx} style={styles.previewItemRow}>
                            <Text style={styles.previewItemIndex}>#{startRowIdx + idx + 1}</Text>
                            <View style={styles.previewItemInfo}>
                              <Text style={styles.previewItemTitle}>
                                Số HĐ: {item.cleanInvoiceNumber} ({item.rawInvoiceNumber})
                              </Text>
                              <Text style={styles.previewItemDetails}>
                                Ngày: {item.dateStr || 'Thiếu'} • Tiền:{' '}
                                {item.isAmountValid ? `${item.amountFormatted} đ` : 'Thiếu'}
                              </Text>
                            </View>
                            {item.hasErrors && (
                              <View style={styles.rowErrorBadge}>
                                <Text style={styles.rowErrorBadgeText}>Thiếu ô</Text>
                              </View>
                            )}
                            <View style={styles.previewActionBtns}>
                              <TouchableOpacity
                                style={styles.previewMiniBtn}
                                onPress={() => setStartInput(item.cleanInvoiceNumber)}
                              >
                                <Text style={styles.previewMiniBtnText}>🟢 Đầu</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.previewMiniBtn}
                                onPress={() => setEndInput(item.cleanInvoiceNumber)}
                              >
                                <Text style={styles.previewMiniBtnText}>🏁 Cuối</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptySheetBox}>
                <Text style={styles.emptySheetText}>
                  Sheet này không tìm thấy dòng hóa đơn có dữ liệu ở Cột A. Vui lòng chọn Sheet khác.
                </Text>
              </View>
            )}
          </View>

          {/* Tùy chỉnh thông tin mặc định (Đơn vị, Người nộp, Người ký) */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.configToggle}
              onPress={() => setShowConfig(!showConfig)}
            >
              <Text style={styles.configToggleTitle}>
                ⚙️ {showConfig ? 'Thu gọn' : 'Xem & Tùy chỉnh'} thông tin mặc định phiếu thu
              </Text>
              <Text style={styles.configToggleArrow}>{showConfig ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showConfig && (
              <View style={styles.configForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tên đơn vị bán / thu tiền:</Text>
                  <TextInput
                    style={styles.formInput}
                    value={config.companyName}
                    onChangeText={(val) => setConfig((p) => ({ ...p, companyName: val }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Người nộp tiền:</Text>
                  <TextInput
                    style={styles.formInput}
                    value={config.submitterName}
                    onChangeText={(val) => setConfig((p) => ({ ...p, submitterName: val }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Địa chỉ:</Text>
                  <TextInput
                    style={styles.formInput}
                    value={config.submitterAddress}
                    onChangeText={(val) => setConfig((p) => ({ ...p, submitterAddress: val }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Lý do nộp:</Text>
                  <TextInput
                    style={styles.formInput}
                    value={config.paymentReason}
                    onChangeText={(val) => setConfig((p) => ({ ...p, paymentReason: val }))}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Giám đốc ký:</Text>
                    <TextInput
                      style={styles.formInput}
                      value={config.directorName}
                      onChangeText={(val) => setConfig((p) => ({ ...p, directorName: val }))}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Kế toán trưởng:</Text>
                    <TextInput
                      style={styles.formInput}
                      value={config.chiefAccountantName}
                      onChangeText={(val) => setConfig((p) => ({ ...p, chiefAccountantName: val }))}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Nút Xuất Phiếu Thu Word */}
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[
                styles.generateBtn,
                (!isValidRange || isProcessing) && styles.generateBtnDisabled,
              ]}
              onPress={handleGenerateDocx}
              disabled={!isValidRange || isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.generateBtnIcon}>📄</Text>
              <Text style={styles.generateBtnText}>
                {isValidRange
                  ? `XUẤT ${selectedItems.length} PHIẾU THU WORD (.DOCX)`
                  : 'VUI LÒNG ĐIỀN ĐÚNG SỐ HÓA ĐƠN ĐỂ XUẤT'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.generateHint}>
              {isValidRange
                ? 'Tự động tải về file Word và mở bảng chia sẻ qua Zalo, Tin nhắn...'
                : 'Hệ thống đã khóa nút xuất do khoảng hóa đơn chưa hợp lệ hoặc bị lỗi.'}
            </Text>
          </View>
        </>
      )}

      {/* Modal hiển thị bảng dữ liệu sheet để chọn trực quan */}
      <SheetDataPickerModal
        visible={isSheetPickerVisible}
        sheetName={selectedSheet}
        items={allItemsInSheet}
        initialStart={startInput}
        initialEnd={endInput}
        onApply={(s, e) => {
          setStartInput(s);
          setEndInput(e);
        }}
        onClose={() => setIsSheetPickerVisible(false)}
      />

      {/* Modal hiển thị kết quả & báo lỗi các index fail */}
      {lastResult && (
        <ReceiptResultModal
          visible={resultModalVisible}
          onClose={() => setResultModalVisible(false)}
          fileName={lastResult.fileName}
          totalCount={lastResult.totalCount}
          successCount={lastResult.successCount}
          failedCount={lastResult.failedCount}
          failedItems={lastResult.failedItems}
          onShare={handleShareResult}
          onDownload={handleDownloadResult}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  uploadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  uploadCardDragging: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2642',
  },
  uploadHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  pickButton: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0284C7',
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickButtonDragging: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C4A6E',
  },
  pickIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  pickTitle: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  fileSelectedBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0284C7',
    gap: 10,
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  excelIcon: {
    fontSize: 24,
  },
  fileTextCol: {
    flex: 1,
  },
  fileName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  fileStats: {
    color: '#38BDF8',
    fontSize: 11,
    marginTop: 2,
  },
  changeFileBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  changeFileBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBanner: {
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
  loadingText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetCountBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  sheetSliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetNavArrow: {
    width: 32,
    height: 38,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sheetNavArrowLeft: {},
  sheetNavArrowRight: {},
  sheetNavArrowDisabled: {
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    opacity: 0.35,
  },
  sheetNavArrowText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetNavArrowTextDisabled: {
    color: '#64748B',
  },
  sheetScrollContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  sheetScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  sheetChip: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sheetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  sheetChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  indexHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  indexSubInfo: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  rangePickerContainer: {
    gap: 12,
  },
  inputRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputColLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  rangeInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  rangeInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#2A1215',
  },
  rangeArrow: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  inputPreviewValid: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  inputPreviewError: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  inputPreviewHint: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  quickPresetsLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  presetChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  validationErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#451A03',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
    marginTop: 4,
  },
  validationErrorIcon: {
    fontSize: 16,
  },
  validationErrorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryHighlight: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
  },
  summarySub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  summaryBold: {
    color: '#E2E8F0',
    fontWeight: '700',
  },
  warningPill: {
    backgroundColor: '#78350F',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 160,
  },
  warningPillText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '700',
  },
  successPill: {
    backgroundColor: '#064E3B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  successPillText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  previewToggleWrapper: {
    marginTop: 4,
  },
  previewToggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  previewToggleText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  previewListScroll: {
    maxHeight: 180,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  previewItemIndex: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    width: 36,
  },
  previewItemInfo: {
    flex: 1,
  },
  previewItemTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  previewItemDetails: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },
  rowErrorBadge: {
    backgroundColor: '#B45309',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rowErrorBadgeText: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '700',
  },
  emptySheetBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptySheetText: {
    color: '#F87171',
    fontSize: 12,
    textAlign: 'center',
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configToggleTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  configToggleArrow: {
    color: '#94A3B8',
    fontSize: 12,
  },
  configForm: {
    marginTop: 14,
    gap: 10,
  },
  formGroup: {
    gap: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
    gap: 4,
  },
  formLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  formInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  generateBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnIcon: {
    fontSize: 18,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  generateHint: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  openSheetPickerBtn: {
    backgroundColor: '#0F2642',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  openSheetPickerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openSheetPickerIcon: {
    fontSize: 20,
  },
  openSheetPickerTextBox: {
    flex: 1,
  },
  openSheetPickerTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  openSheetPickerDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  openSheetPickerBadgeBox: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openSheetPickerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  inputColLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickLinkBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  pickLinkText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  previewActionBtns: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 6,
  },
  previewMiniBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#475569',
  },
  previewMiniBtnText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
});
