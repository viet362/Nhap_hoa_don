import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { InvoiceItem, ExportSettings } from '../types/invoice';

interface InvoiceTableProps {
  items: InvoiceItem[];
  settings: ExportSettings;
  onUpdateSettings: (settings: Partial<ExportSettings>) => void;
  onUpdateItem: (id: string, updates: Partial<InvoiceItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  items,
  settings,
  onUpdateSettings,
  onUpdateItem,
  onDeleteItem,
  onClearAll,
}) => {
  // Tính tổng
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.weight) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  return (
    <View style={styles.container}>
      {/* Cấu hình ngày tạo bảng kê */}
      <View style={styles.configCard}>
        <View style={styles.configRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.configLabel}>📅 Ngày tạo bảng kê (DD/MM/YYYY):</Text>
            <TextInput
              style={styles.dateInput}
              value={settings.creationDate}
              onChangeText={(text) => {
                const parts = text.split('/');
                let fileDate = text.replace(/\//g, '.');
                if (parts.length === 3) {
                  const yy = parts[2].slice(-2);
                  fileDate = `${parts[0]}.${parts[1]}.${yy}`;
                }
                onUpdateSettings({
                  creationDate: text,
                  fileNameDate: fileDate,
                });
              }}
              placeholder="06/10/2026"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Thay cột Ngày lập bằng Ngày tạo</Text>
          <Switch
            value={settings.useCreationDateForAll}
            onValueChange={(val) => onUpdateSettings({ useCreationDateForAll: val })}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={settings.useCreationDateForAll ? '#38BDF8' : '#94A3B8'}
          />
        </View>
      </View>

      {/* KPI Tóm tắt */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>SỐ HÓA ĐƠN</Text>
          <Text style={styles.kpiValue}>{items.length}</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>TỔNG TRỌNG LƯỢNG</Text>
          <Text style={styles.kpiValue}>
            {totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg
          </Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>TỔNG TIỀN (VNĐ)</Text>
          <Text style={[styles.kpiValue, styles.kpiHighlight]}>
            {totalAmount.toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>

      {/* Tiêu đề danh sách & nút xóa tất cả */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>CHI TIẾT CÁC DÒNG HÓA ĐƠN</Text>
        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={onClearAll}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.clearAllText}>🗑️ Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách từng hóa đơn */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>Chưa có hóa đơn nào được nạp</Text>
          <Text style={styles.emptySubText}>
            Hãy bấm "Chọn từ Thư viện" hoặc "Chụp Camera" ở trên để tải hóa đơn lên.
          </Text>
        </View>
      ) : (
        items.map((item, index) => {
          const rowTotal = (Number(item.weight) || 0) * (Number(item.unitPrice) || 0);
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.badgeRow}>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexBadgeText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.itemInvoiceNum}>Số HĐ: {item.invoiceNumber}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDeleteItem(item.id)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemProduct}>{item.productName}</Text>
              <Text style={styles.itemSeller} numberOfLines={1}>
                {item.sellerName}
              </Text>

              <View style={styles.editRow}>
                <View style={styles.editCol}>
                  <Text style={styles.inputLabel}>Trọng lượng (kg):</Text>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="numeric"
                    value={String(item.weight)}
                    onChangeText={(val) => {
                      const num = parseFloat(val.replace(',', '.')) || 0;
                      onUpdateItem(item.id, { weight: num });
                    }}
                  />
                </View>

                <View style={styles.editCol}>
                  <Text style={styles.inputLabel}>Đơn giá (đ):</Text>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="numeric"
                    value={String(item.unitPrice)}
                    onChangeText={(val) => {
                      const num = parseFloat(val.replace(/[.,]/g, '')) || 0;
                      onUpdateItem(item.id, { unitPrice: num });
                    }}
                  />
                </View>
              </View>

              <View style={styles.itemFooter}>
                <Text style={styles.dateFooterText}>
                  Ngày: {settings.useCreationDateForAll ? settings.creationDate : item.originalInvoiceDate}
                </Text>
                <Text style={styles.rowTotalText}>
                  {rowTotal.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  configCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInputContainer: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  kpiHighlight: {
    color: '#38BDF8',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearAllText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indexBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  itemInvoiceNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  itemProduct: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSeller: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  editCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  numberInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 4,
  },
  dateFooterText: {
    fontSize: 11,
    color: '#64748B',
  },
  rowTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399', // Emerald
  },
});
