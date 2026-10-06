import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';

interface AppShareModalProps {
  visible: boolean;
  onClose: () => void;
  fileName: string;
  itemCount: number;
  onRedownload?: () => void;
}

interface ShareAppOption {
  id: string;
  name: string;
  description: string;
  iconText: string;
  badgeBg: string;
  scheme: string;
  fallbackUrl?: string;
}

const SHARE_APPS: ShareAppOption[] = [
  {
    id: 'zalo',
    name: 'Zalo',
    description: 'Chạm để mở Zalo',
    iconText: '💬',
    badgeBg: '#0068FF',
    scheme: 'zalo://',
    fallbackUrl: 'https://zalo.me',
  },
  {
    id: 'sms',
    name: 'Tin nhắn (SMS)',
    description: 'Mở ứng dụng Tin nhắn',
    iconText: '📱',
    badgeBg: '#10B981',
    scheme: 'sms:',
  },
  {
    id: 'email',
    name: 'Gmail / Mail',
    description: 'Mở hòm thư Email',
    iconText: '✉️',
    badgeBg: '#EA4335',
    scheme: 'mailto:?subject=B%E1%BA%A3ng%20k%C3%AA%20h%C3%B3a%20%C4%91%C6%A1n',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Mở ứng dụng Telegram',
    iconText: '✈️',
    badgeBg: '#229ED9',
    scheme: 'tg://',
    fallbackUrl: 'https://t.me',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    description: 'Mở FB Messenger',
    iconText: '⚡',
    badgeBg: '#A855F7',
    scheme: 'fb-messenger://',
    fallbackUrl: 'https://m.me',
  },
  {
    id: 'viber',
    name: 'Viber',
    description: 'Mở ứng dụng Viber',
    iconText: '📞',
    badgeBg: '#7360F2',
    scheme: 'viber://',
    fallbackUrl: 'https://viber.com',
  },
];

export const AppShareModal: React.FC<AppShareModalProps> = ({
  visible,
  onClose,
  fileName,
  itemCount,
  onRedownload,
}) => {
  const handleOpenApp = (app: ShareAppOption) => {
    if (typeof window !== 'undefined') {
      const start = Date.now();
      // Thử mở ứng dụng qua Deep Link scheme
      window.location.href = app.scheme;

      // Nếu sau 1.5s không chuyển sang app (máy chưa cài app), mở link fallback nếu có
      if (app.fallbackUrl) {
        setTimeout(() => {
          if (Date.now() - start < 2000) {
            window.open(app.fallbackUrl, '_blank');
          }
        }, 1500);
      }
    } else {
      Linking.openURL(app.scheme).catch(() => {
        if (app.fallbackUrl) {
          Linking.openURL(app.fallbackUrl);
        }
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header thông báo tải thành công */}
            <View style={styles.header}>
              <View style={styles.successIconBadge}>
                <Text style={styles.successIcon}>✅</Text>
              </View>
              <Text style={styles.title}>ĐÃ TẢI FILE EXCEL VỀ MÁY</Text>
              <Text style={styles.subtitle}>
                File gồm {itemCount} hóa đơn đã sẵn sàng để gửi
              </Text>
            </View>

            {/* Thông tin vị trí lưu file */}
            <View style={styles.fileCard}>
              <View style={styles.fileRow}>
                <Text style={styles.fileIcon}>📄</Text>
                <View style={styles.fileTextStack}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {fileName}
                  </Text>
                  <Text style={styles.fileLocation}>
                    📍 Vị trí: Đã lưu vào thư mục Download (Tải về)
                  </Text>
                </View>
              </View>
            </View>

            {/* Hướng dẫn 2 bước */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>💡 2 bước gửi file cực dễ:</Text>
              <Text style={styles.guideStep}>
                <Text style={styles.stepNum}>1. </Text>Chọn ứng dụng bên dưới để chuyển thẳng sang app.
              </Text>
              <Text style={styles.guideStep}>
                <Text style={styles.stepNum}>2. </Text>Vào chat ➔ Bấm nút <Text style={styles.boldText}>📎 Đính kèm / Tệp</Text> ➔ Chọn file bảng kê vừa tải ở trên cùng để gửi.
              </Text>
            </View>

            {/* Tiêu đề danh sách ứng dụng */}
            <Text style={styles.sectionHeading}>CHỌN ỨNG DỤNG ĐỂ GỬI FILE:</Text>

            {/* Lưới các ứng dụng (Zalo, Tin nhắn, Gmail, Telegram...) */}
            <View style={styles.appGrid}>
              {SHARE_APPS.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.appBtn}
                  onPress={() => handleOpenApp(app)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.appIconWrap, { backgroundColor: app.badgeBg }]}>
                    <Text style={styles.appIconText}>{app.iconText}</Text>
                  </View>
                  <View style={styles.appTextContainer}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appDesc}>{app.description}</Text>
                  </View>
                  <Text style={styles.arrowIcon}>➔</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nút tải lại file nếu cần */}
            {onRedownload && (
              <TouchableOpacity
                style={styles.redownloadBtn}
                onPress={onRedownload}
                activeOpacity={0.7}
              >
                <Text style={styles.redownloadText}>🔄 Bấm vào đây nếu muốn tải lại file</Text>
              </TouchableOpacity>
            )}

            {/* Nút đóng */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Xong / Đóng</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  scrollArea: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  fileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  fileTextStack: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  fileLocation: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 3,
    fontWeight: '500',
  },
  guideCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 6,
  },
  guideStep: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 4,
  },
  stepNum: {
    fontWeight: '700',
    color: '#38BDF8',
  },
  boldText: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  appGrid: {
    gap: 10,
    marginBottom: 16,
  },
  appBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  appIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 20,
  },
  appTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  arrowIcon: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 8,
  },
  redownloadBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  redownloadText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  closeBtn: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 15,
  },
});
