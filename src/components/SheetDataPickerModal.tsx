import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { ReceiptItem } from '../types/receipt';

interface SheetDataPickerModalProps {
  visible: boolean;
  sheetName: string;
  items: ReceiptItem[];
  initialStart: string;
  initialEnd: string;
  onApply: (startNum: string, endNum: string) => void;
  onClose: () => void;
}

export const SheetDataPickerModal: React.FC<SheetDataPickerModalProps> = ({
  visible,
  sheetName,
  items,
  initialStart,
  initialEnd,
  onApply,
  onClose,
}) => {
  const [startNum, setStartNum] = useState<string>(initialStart);
  const [endNum, setEndNum] = useState<string>(initialEnd);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetPick, setTargetPick] = useState<'start' | 'end'>('start');

  // Đồng bộ giá trị khi mở modal: Mặc định chọn Bắt đầu
  useEffect(() => {
    if (visible) {
      setStartNum(initialStart);
      setEndNum(initialEnd);
      setSearchQuery('');
      setTargetPick('start');
    }
  }, [visible, initialStart, initialEnd]);

  // Hàm tìm index của item trong mảng gốc items
  const getItemIndex = (q: string): number => {
    if (!q || !q.trim()) return -1;
    const clean = q.trim().replace(/^0+/, '') || q.trim();
    const raw = q.trim();

    return items.findIndex(
      (it) =>
        it.cleanInvoiceNumber === clean ||
        it.rawInvoiceNumber === raw ||
        it.cleanInvoiceNumber === raw ||
        parseInt(it.cleanInvoiceNumber, 10) === parseInt(clean, 10)
    );
  };

  const startIdx = getItemIndex(startNum);
  const endIdx = getItemIndex(endNum);

  // Tính số lượng phiếu được chọn
  const isValidRange = startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx;
  const selectedCount = isValidRange ? endIdx - startIdx + 1 : 0;

  // Xử lý khi người dùng nhấp vào một dòng hoặc ô trong bảng
  const handleSelectRow = (item: ReceiptItem) => {
    const clickedIdx = items.findIndex((it) => it.rowIndex === item.rowIndex);
    if (clickedIdx === -1) return;

    if (targetPick === 'start') {
      setStartNum(item.cleanInvoiceNumber);
      // Nếu điểm bắt đầu mới vượt quá điểm kết thúc hiện tại, tự động dời điểm kết thúc bằng điểm bắt đầu
      if (endIdx !== -1 && clickedIdx > endIdx) {
        setEndNum(item.cleanInvoiceNumber);
      }
    } else {
      // targetPick === 'end'
      // Nếu điểm kết thúc nhỏ hơn điểm bắt đầu, tự động kéo điểm bắt đầu về dòng này
      if (startIdx !== -1 && clickedIdx < startIdx) {
        setStartNum(item.cleanInvoiceNumber);
      } else {
        setEndNum(item.cleanInvoiceNumber);
      }
    }
  };

  const handleSetStart = (item: ReceiptItem) => {
    setStartNum(item.cleanInvoiceNumber);
    const clickedIdx = items.findIndex((it) => it.rowIndex === item.rowIndex);
    if (endIdx !== -1 && clickedIdx > endIdx) {
      setEndNum(item.cleanInvoiceNumber);
    }
  };

  const handleSetEnd = (item: ReceiptItem) => {
    const clickedIdx = items.findIndex((it) => it.rowIndex === item.rowIndex);
    if (startIdx !== -1 && clickedIdx < startIdx) {
      setEndNum(items[startIdx].cleanInvoiceNumber);
      setStartNum(item.cleanInvoiceNumber);
    } else {
      setEndNum(item.cleanInvoiceNumber);
    }
  };

  // Lọc theo tìm kiếm
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.cleanInvoiceNumber.toLowerCase().includes(q) ||
        it.rawInvoiceNumber.toLowerCase().includes(q) ||
        it.dateStr.toLowerCase().includes(q) ||
        it.amountFormatted.includes(q) ||
        (it.itemName && it.itemName.toLowerCase().includes(q)) ||
        (it.customerName && it.customerName.toLowerCase().includes(q)) ||
        String(it.rowIndex).includes(q)
    );
  }, [items, searchQuery]);

  // Áp dụng và đóng modal
  const handleApply = () => {
    onApply(startNum, endNum);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>📋</Text>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>Bảng Dữ Liệu Sheet: {sheetName}</Text>
                <Text style={styles.headerSubtitle}>
                  Có {items.length} dòng hóa đơn • Nhấp trực tiếp vào ô để chọn khoảng xuất
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Thanh Tóm Tắt Khoảng Đang Chọn */}
          <View style={styles.selectionSummaryCard}>
            <View style={styles.summaryColsRow}>
              {/* Cột Bắt Đầu */}
              <TouchableOpacity
                style={[
                  styles.summaryEndpointBox,
                  targetPick === 'start' && styles.summaryEndpointActiveStart,
                ]}
                onPress={() => setTargetPick('start')}
                activeOpacity={0.8}
              >
                <View style={styles.endpointLabelRow}>
                  <Text style={styles.endpointDotStart}>●</Text>
                  <Text style={styles.endpointLabel}>1. Điểm Bắt Đầu:</Text>
                  {targetPick === 'start' && <Text style={styles.targetBadge}>ĐANG CHỌN</Text>}
                </View>
                <Text style={styles.endpointValue}>
                  {startIdx !== -1
                    ? `HĐ #${items[startIdx].cleanInvoiceNumber} (Dòng ${items[startIdx].rowIndex})`
                    : startNum
                      ? `HĐ #${startNum} (Không tìm thấy)`
                      : 'Chưa chọn'}
                </Text>
                {startIdx !== -1 && (
                  <Text style={styles.endpointSub} numberOfLines={1}>
                    {items[startIdx].dateStr || 'Thiếu ngày'} •{' '}
                    {items[startIdx].isAmountValid
                      ? `${items[startIdx].amountFormatted} đ`
                      : 'Thiếu tiền'}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.summaryArrow}>➔</Text>

              {/* Cột Kết Thúc */}
              <TouchableOpacity
                style={[
                  styles.summaryEndpointBox,
                  targetPick === 'end' && styles.summaryEndpointActiveEnd,
                ]}
                onPress={() => setTargetPick('end')}
                activeOpacity={0.8}
              >
                <View style={styles.endpointLabelRow}>
                  <Text style={styles.endpointDotEnd}>●</Text>
                  <Text style={styles.endpointLabel}>2. Điểm Kết Thúc:</Text>
                  {targetPick === 'end' && <Text style={styles.targetBadge}>ĐANG CHỌN</Text>}
                </View>
                <Text style={styles.endpointValue}>
                  {endIdx !== -1
                    ? `HĐ #${items[endIdx].cleanInvoiceNumber} (Dòng ${items[endIdx].rowIndex})`
                    : endNum
                      ? `HĐ #${endNum} (Không tìm thấy)`
                      : 'Chưa chọn'}
                </Text>
                {endIdx !== -1 && (
                  <Text style={styles.endpointSub} numberOfLines={1}>
                    {items[endIdx].dateStr || 'Thiếu ngày'} •{' '}
                    {items[endIdx].isAmountValid
                      ? `${items[endIdx].amountFormatted} đ`
                      : 'Thiếu tiền'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Badge Tổng Số Lượng */}
              <View style={styles.countBadgeBox}>
                <Text style={styles.countBadgeNum}>{isValidRange ? selectedCount : 0}</Text>
                <Text style={styles.countBadgeLabel}>Phiếu thu Word</Text>
              </View>
            </View>

            {/* Các phím chọn nhanh & Chế độ nhấp chuột */}
            <View style={styles.quickBarRow}>
              <View style={styles.quickShortcuts}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => {
                    if (items.length > 0) setStartNum(items[0].cleanInvoiceNumber);
                  }}
                >
                  <Text style={styles.quickBtnText}>⏮️ Về dòng đầu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => {
                    if (items.length > 0) setEndNum(items[items.length - 1].cleanInvoiceNumber);
                  }}
                >
                  <Text style={styles.quickBtnText}>⏭️ Đến dòng cuối</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => {
                    if (items.length > 0) {
                      setStartNum(items[0].cleanInvoiceNumber);
                      setEndNum(items[items.length - 1].cleanInvoiceNumber);
                    }
                  }}
                >
                  <Text style={styles.quickBtnText}>🔄 Chọn tất cả</Text>
                </TouchableOpacity>
              </View>

              {/* Chế độ nhấp ô: Mặc định chọn Bắt đầu */}
              <View style={styles.modeToggleGroup}>
                <Text style={styles.modeToggleLabel}>Nhấp ô để chọn:</Text>
                <TouchableOpacity
                  style={[styles.modeChip, targetPick === 'start' && styles.modeChipActiveStart]}
                  onPress={() => setTargetPick('start')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeChipText, targetPick === 'start' && styles.modeChipTextActive]}>
                    🟢 Bắt đầu
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeChip, targetPick === 'end' && styles.modeChipActiveEnd]}
                  onPress={() => setTargetPick('end')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeChipText, targetPick === 'end' && styles.modeChipTextActive]}>
                    🏁 Kết thúc
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Thanh Tìm Kiếm Nhanh */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm nhanh theo số HĐ (vd: 1117), ngày (vd: 26/09), số tiền, mặt hàng..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.searchCountBadge}>
              {filteredItems.length}/{items.length} dòng
            </Text>
          </View>

          {/* Bảng Dữ Liệu Dạng Spreadsheet Grid */}
          <View style={styles.tableWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableHScroll}>
              <View>
                {/* Header Bảng */}
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.thCell, { width: 70 }]}>
                    <Text style={styles.thText}>Dòng Excel</Text>
                  </View>
                  <View style={[styles.thCell, { width: 120 }]}>
                    <Text style={styles.thText}>Số HĐ (Cột A)</Text>
                  </View>
                  <View style={[styles.thCell, { width: 100 }]}>
                    <Text style={styles.thText}>Ngày (Cột D)</Text>
                  </View>
                  <View style={[styles.thCell, { width: 130 }]}>
                    <Text style={styles.thText}>Số Tiền (Cột Q)</Text>
                  </View>
                  <View style={[styles.thCell, { width: 220 }]}>
                    <Text style={styles.thText}>Mặt Hàng / Ghi Chú</Text>
                  </View>
                  <View style={[styles.thCell, { width: 90 }]}>
                    <Text style={styles.thText}>Trạng Thái</Text>
                  </View>
                  <View style={[styles.thCell, { width: 170, borderRightWidth: 0 }]}>
                    <Text style={styles.thText}>Thao Tác Nhanh</Text>
                  </View>
                </View>

                {/* Danh Sách Hàng */}
                <ScrollView style={styles.tableBodyScroll} nestedScrollEnabled>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const itemGlobalIdx = items.findIndex((it) => it.rowIndex === item.rowIndex);
                      const isStart = itemGlobalIdx === startIdx;
                      const isEnd = itemGlobalIdx === endIdx;
                      const isInRange =
                        isValidRange && itemGlobalIdx >= startIdx && itemGlobalIdx <= endIdx;

                      return (
                        <TouchableOpacity
                          key={`row-${item.rowIndex}`}
                          style={[
                            styles.tableRow,
                            isInRange && styles.tableRowInRange,
                            isStart && styles.tableRowStart,
                            isEnd && styles.tableRowEnd,
                          ]}
                          onPress={() => handleSelectRow(item)}
                          activeOpacity={0.7}
                        >
                          {/* 1. Dòng Excel */}
                          <View style={[styles.tdCell, { width: 70 }]}>
                            <Text
                              style={[
                                styles.tdTextIndex,
                                (isStart || isEnd) && styles.tdTextHighlighted,
                              ]}
                            >
                              Dòng {item.rowIndex}
                            </Text>
                          </View>

                          {/* 2. Số HĐ (Cột A) */}
                          <View style={[styles.tdCell, { width: 120 }]}>
                            <View style={styles.invoiceNumBadge}>
                              <Text style={styles.invoiceCleanText}>
                                #{item.cleanInvoiceNumber}
                              </Text>
                              {item.rawInvoiceNumber !== item.cleanInvoiceNumber && (
                                <Text style={styles.invoiceRawText}>({item.rawInvoiceNumber})</Text>
                              )}
                            </View>
                            {isStart && (
                              <View style={styles.tagStart}>
                                <Text style={styles.tagText}>🟢 BẮT ĐẦU</Text>
                              </View>
                            )}
                            {isEnd && (
                              <View style={styles.tagEnd}>
                                <Text style={styles.tagText}>🏁 KẾT THÚC</Text>
                              </View>
                            )}
                          </View>

                          {/* 3. Ngày (Cột D) */}
                          <View style={[styles.tdCell, { width: 100 }]}>
                            <Text
                              style={[
                                styles.tdTextDate,
                                !item.isDateValid && styles.tdTextError,
                              ]}
                            >
                              {item.dateStr || 'Trống'}
                            </Text>
                          </View>

                          {/* 4. Số Tiền (Cột Q) */}
                          <View style={[styles.tdCell, { width: 130 }]}>
                            <Text
                              style={[
                                styles.tdTextAmount,
                                !item.isAmountValid && styles.tdTextError,
                              ]}
                            >
                              {item.isAmountValid ? `${item.amountFormatted} đ` : 'Trống'}
                            </Text>
                          </View>

                          {/* 5. Mặt Hàng / Ghi Chú */}
                          <View style={[styles.tdCell, { width: 220 }]}>
                            <Text style={styles.tdTextDesc} numberOfLines={2}>
                              {item.itemName || item.customerName || '—'}
                            </Text>
                          </View>

                          {/* 6. Trạng Thái */}
                          <View style={[styles.tdCell, { width: 90 }]}>
                            {item.hasErrors ? (
                              <View style={styles.badgeWarn}>
                                <Text style={styles.badgeWarnText}>⚠️ Thiếu ô</Text>
                              </View>
                            ) : (
                              <View style={styles.badgeValid}>
                                <Text style={styles.badgeValidText}>✓ Đủ ô</Text>
                              </View>
                            )}
                          </View>

                          {/* 7. Thao Tác Nhanh */}
                          <View
                            style={[
                              styles.tdCell,
                              styles.actionCell,
                              { width: 170, borderRightWidth: 0 },
                            ]}
                          >
                            <TouchableOpacity
                              style={[styles.rowActionBtn, isStart && styles.rowActionBtnActiveStart]}
                              onPress={() => handleSetStart(item)}
                            >
                              <Text style={styles.rowActionBtnText}>🟢 Bắt đầu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.rowActionBtn, isEnd && styles.rowActionBtnActiveEnd]}
                              onPress={() => handleSetEnd(item)}
                            >
                              <Text style={styles.rowActionBtnText}>🏁 Kết thúc</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptySearchBox}>
                      <Text style={styles.emptySearchText}>
                        Không tìm thấy hóa đơn nào khớp với "{searchQuery}"
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </ScrollView>
          </View>

          {/* Footer Hành Động */}
          <View style={styles.footer}>
            <View style={styles.footerSummaryCol}>
              <Text style={styles.footerSummaryTitle}>
                {isValidRange
                  ? `Sẽ xuất ${selectedCount} phiếu thu Word`
                  : 'Chưa chọn khoảng hợp lệ'}
              </Text>
              <Text style={styles.footerSummarySub}>
                {isValidRange
                  ? `Từ HĐ #${items[startIdx].cleanInvoiceNumber} ➔ Đến HĐ #${items[endIdx].cleanInvoiceNumber}`
                  : 'Vui lòng chọn điểm bắt đầu và kết thúc'}
              </Text>
            </View>

            <View style={styles.footerActionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyBtn, !isValidRange && styles.applyBtnDisabled]}
                onPress={handleApply}
                disabled={!isValidRange}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnIcon}>✓</Text>
                <Text style={styles.applyBtnText}>
                  {isValidRange
                    ? `ÁP DỤNG (${selectedCount} PHIẾU)`
                    : 'CHƯA CHỌN KHOẢNG'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 8,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 980,
    maxHeight: '94%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    fontSize: 26,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '700',
  },
  selectionSummaryCard: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 12,
  },
  summaryColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryEndpointBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  summaryEndpointActiveStart: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  summaryEndpointActiveEnd: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C4A6E',
  },
  endpointLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  endpointDotStart: {
    color: '#10B981',
    fontSize: 10,
  },
  endpointDotEnd: {
    color: '#38BDF8',
    fontSize: 10,
  },
  endpointLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  targetBadge: {
    color: '#FDE047',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: '#713F12',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  endpointValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  endpointSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  summaryArrow: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '700',
  },
  countBadgeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
    minWidth: 100,
  },
  countBadgeNum: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '900',
  },
  countBadgeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  quickBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  quickShortcuts: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  quickBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  modeToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeToggleLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modeChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  modeChipActiveStart: {
    backgroundColor: '#047857',
    borderColor: '#10B981',
  },
  modeChipActiveEnd: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  modeChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 12,
    paddingVertical: 4,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  searchCountBadge: {
    color: '#64748B',
    fontSize: 11,
  },
  tableWrapper: {
    flex: 1,
    minHeight: 280,
    backgroundColor: '#0F172A',
  },
  tableHScroll: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  thCell: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#334155',
    justifyContent: 'center',
  },
  thText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  tableRowInRange: {
    backgroundColor: '#082F49',
  },
  tableRowStart: {
    backgroundColor: '#064E3B',
  },
  tableRowEnd: {
    backgroundColor: '#0C4A6E',
  },
  tdCell: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    justifyContent: 'center',
  },
  tdTextIndex: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  tdTextHighlighted: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  invoiceNumBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  invoiceCleanText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  invoiceRawText: {
    color: '#64748B',
    fontSize: 10,
  },
  tagStart: {
    backgroundColor: '#059669',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  tagEnd: {
    backgroundColor: '#0284C7',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tdTextDate: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
  },
  tdTextAmount: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  tdTextDesc: {
    color: '#94A3B8',
    fontSize: 11,
  },
  tdTextError: {
    color: '#EF4444',
  },
  badgeValid: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeValidText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeWarn: {
    backgroundColor: '#78350F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeWarnText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '600',
  },
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowActionBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  rowActionBtnActiveStart: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },
  rowActionBtnActiveEnd: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  rowActionBtnText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  emptySearchBox: {
    padding: 30,
    alignItems: 'center',
    width: 600,
  },
  emptySearchText: {
    color: '#64748B',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerSummaryCol: {
    flex: 1,
  },
  footerSummaryTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  footerSummarySub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  footerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0284C7',
  },
  applyBtnDisabled: {
    backgroundColor: '#334155',
  },
  applyBtnIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
