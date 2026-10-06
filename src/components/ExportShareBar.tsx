import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface ExportShareBarProps {
  onExportAndShare: () => void;
  isExporting: boolean;
  itemCount: number;
  fileNameDate: string;
}

export const ExportShareBar: React.FC<ExportShareBarProps> = ({
  onExportAndShare,
  isExporting,
  itemCount,
  fileNameDate,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.fileInfoRow}>
        <Text style={styles.fileLabel}>Tên file xuất:</Text>
        <Text style={styles.fileNameText} numberOfLines={1}>
          BẢNG KÊ HÀNG HÓA MUA VÀO NGÀY {fileNameDate}.xlsx
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.shareBtn,
          itemCount === 0 && styles.disabledBtn,
        ]}
        onPress={onExportAndShare}
        disabled={isExporting || itemCount === 0}
        activeOpacity={0.85}
      >
        {isExporting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.shareBtnText}>Đang xuất file Excel...</Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            <Text style={styles.shareIcon}>📤</Text>
            <View style={styles.textStack}>
              <Text style={styles.shareBtnText}>
                XUẤT & CHIA SẺ FILE (ZALO, TIN NHẮN...)
              </Text>
              <Text style={styles.shareBtnSubText}>
                Gửi trực tiếp qua Zalo, iMessage, Mail, AirDrop
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  fileLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fileNameText: {
    flex: 1,
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: '#059669', // Emerald 600 - Rich green for sharing
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareIcon: {
    fontSize: 24,
  },
  textStack: {
    alignItems: 'flex-start',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  shareBtnSubText: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
