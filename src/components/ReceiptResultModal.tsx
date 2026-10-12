import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { ReceiptItem } from '../types/receipt';

interface ReceiptResultModalProps {
  visible: boolean;
  onClose: () => void;
  fileName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  failedItems: ReceiptItem[];
  onShare: () => void;
  onDownload: () => void;
}

export const ReceiptResultModal: React.FC<ReceiptResultModalProps> = ({
  visible,
  onClose,
  fileName,
  totalCount,
  successCount,
  failedCount,
  failedItems,
  onShare,
  onDownload,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.icon}>{failedCount > 0 ? '⚠️' : '🎉'}</Text>
              <View>
                <Text style={styles.title}>
                  {failedCount > 0 ? 'Đã tạo xong (Có lưu ý)' : 'Xuất Phiếu Thu Thành Công'}
                </Text>
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {fileName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalCount}</Text>
              <Text style={styles.statLabel}>Tổng phiếu thu</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxSuccess]}>
              <Text style={[styles.statNum, styles.statSuccessText]}>{successCount}</Text>
              <Text style={styles.statLabel}>Đủ thông tin</Text>
            </View>
            {failedCount > 0 && (
              <View style={[styles.statBox, styles.statBoxWarning]}>
                <Text style={[styles.statNum, styles.statWarningText]}>{failedCount}</Text>
                <Text style={styles.statLabel}>Cần điền tay</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.scrollArea}>
            {/* Warning list if any */}
            {failedCount > 0 ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>
                  ⚠️ Danh sách Index có ô không thể đọc tự động ({failedCount}):
                </Text>
                <Text style={styles.warningDesc}>
                  Trong file Word, phiếu thu cho các index này vẫn được tạo đầy đủ các thông tin mặc
                  định (Tên cty, địa chỉ, người nộp, người ký...). Riêng ô bị thiếu dữ liệu đã được
                  chừa trống để bạn điền tay:
                </Text>

                {failedItems.map((item, idx) => (
                  <View key={`fail-${idx}`} style={styles.failedItemCard}>
                    <View style={styles.failedBadge}>
                      <Text style={styles.failedBadgeText}>
                        Index {item.rawInvoiceNumber || item.cleanInvoiceNumber}
                      </Text>
                    </View>
                    <View style={styles.failedErrors}>
                      {item.errorMessages.map((msg, mIdx) => (
                        <Text key={mIdx} style={styles.failedErrorText}>
                          • {msg}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✅ Tất cả phiếu thu đều hợp lệ 100%!</Text>
                <Text style={styles.successDesc}>
                  File Word đã sẵn sàng mở bằng Microsoft Word, WPS Office, Apple Pages hoặc Google Docs.
                  Bạn có thể gửi trực tiếp qua Zalo, Tin nhắn hoặc Tải về máy.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>
                📤 Chia sẻ (Zalo, Tin nhắn...)
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.downloadBtn} onPress={onDownload} activeOpacity={0.8}>
                <Text style={styles.downloadBtnText}>⬇️ Tải lại file về máy</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Đóng</Text>
            </TouchableOpacity>
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
    padding: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  fileNameText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    maxWidth: 320,
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
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statBoxSuccess: {
    borderColor: '#059669',
  },
  statBoxWarning: {
    borderColor: '#D97706',
  },
  statNum: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '800',
  },
  statSuccessText: {
    color: '#10B981',
  },
  statWarningText: {
    color: '#F59E0B',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollArea: {
    maxHeight: 280,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#451A03',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B45309',
  },
  warningTitle: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  warningDesc: {
    color: '#FCD34D',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  failedItemCard: {
    backgroundColor: '#291403',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#78350F',
  },
  failedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  failedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  failedErrors: {
    gap: 2,
  },
  failedErrorText: {
    color: '#FDE68A',
    fontSize: 11,
  },
  successBox: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#059669',
  },
  successTitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  successDesc: {
    color: '#D1FAE5',
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 8,
  },
  shareBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  downloadBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  downloadBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
});
