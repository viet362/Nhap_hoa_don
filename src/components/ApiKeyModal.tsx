import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
  apiKey: string;
  backupApiKey?: string;
  onSave: (primaryKey: string, backupKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  visible,
  onClose,
  apiKey,
  backupApiKey = '',
  onSave,
}) => {
  const [primaryValue, setPrimaryValue] = useState(apiKey);
  const [backupValue, setBackupValue] = useState(backupApiKey);

  // Mặc định ẩn để bảo mật chống lộ thông tin
  const [showPrimary, setShowPrimary] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  // Modal xác thực mật khẩu 8888 khi bấm hiện
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinTarget, setPinTarget] = useState<'primary' | 'backup' | null>(null);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    setPrimaryValue(apiKey);
    setBackupValue(backupApiKey);
    setShowPrimary(false);
    setShowBackup(false);
    setPinModalVisible(false);
    setPinInput('');
    setPinError('');
  }, [apiKey, backupApiKey, visible]);

  const handleTogglePrimary = () => {
    if (showPrimary) {
      // Đang hiện -> bấm vào thì ẩn lại ngay (không cần mật khẩu)
      setShowPrimary(false);
    } else {
      // Đang ẩn -> muốn hiện cần nhập mật khẩu 8888
      setPinTarget('primary');
      setPinInput('');
      setPinError('');
      setPinModalVisible(true);
    }
  };

  const handleToggleBackup = () => {
    if (showBackup) {
      // Đ đang hiện -> bấm vào thì ẩn lại ngay
      setShowBackup(false);
    } else {
      // Đang ẩn -> muốn hiện cần nhập mật khẩu 8888
      setPinTarget('backup');
      setPinInput('');
      setPinError('');
      setPinModalVisible(true);
    }
  };

  const handleVerifyPin = () => {
    if (pinInput.trim() === '8888') {
      if (pinTarget === 'primary') {
        setShowPrimary(true);
      } else if (pinTarget === 'backup') {
        setShowBackup(true);
      }
      setPinModalVisible(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Mật khẩu không chính xác! Vui lòng thử lại.');
    }
  };

  const handleSave = () => {
    onSave(primaryValue.trim(), backupValue.trim());
    Alert.alert('Thành công', 'Đã lưu cấu hình Google Gemini API Key an toàn.');
    onClose();
  };

  const hasPrimary = Boolean(primaryValue.trim());
  const hasBackup = Boolean(backupValue.trim());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.title}>Cấu Hình Gemini AI</Text>
                <Text style={styles.subtitle}>Bảo mật khóa API & Cấu hình dự phòng</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* KEY 1: API Key chính */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>🔑 API Key chính (Primary):</Text>
                <View style={[styles.badge, hasPrimary ? styles.badgeActive : styles.badgeRequired]}>
                  <Text
                    style={[
                      styles.badgeText,
                      hasPrimary ? styles.badgeTextActive : styles.badgeTextRequired,
                    ]}
                  >
                    {hasPrimary ? '✓ Đang dùng' : 'Khuyên dùng'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={primaryValue}
                  onChangeText={setPrimaryValue}
                  placeholder="AIzaSy..."
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPrimary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectTextOnFocus={false}
                />
                {hasPrimary && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setPrimaryValue('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleTogglePrimary}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>{showPrimary ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* KEY 2: API Key dự phòng */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>🛡️ API Key dự phòng (Backup):</Text>
                <View style={[styles.badge, hasBackup ? styles.badgeActive : styles.badgeOptional]}>
                  <Text
                    style={[
                      styles.badgeText,
                      hasBackup ? styles.badgeTextActive : styles.badgeTextOptional,
                    ]}
                  >
                    {hasBackup ? '✓ Đã sẵn sàng' : 'Tùy chọn'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={backupValue}
                  onChangeText={setBackupValue}
                  placeholder="AIzaSy... (dự phòng)"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showBackup}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectTextOnFocus={false}
                />
                {hasBackup && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setBackupValue('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleToggleBackup}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>{showBackup ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldHint}>
                💡 Lấy API Key miễn phí tại Google AI Studio (aistudio.google.com). Tự động dùng khi Key chính gặp sự cố (429 Rate Limit).
              </Text>
            </View>

            {/* Hàng nút bấm */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Lưu Cấu Hình</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Lớp phủ hộp thoại nhập mật khẩu 8888 */}
          {pinModalVisible && (
            <View style={styles.pinOverlay}>
              <View style={styles.pinCard}>
                <View style={styles.pinIconWrapper}>
                  <Text style={styles.pinIcon}>🔐</Text>
                </View>

                <Text style={styles.pinTitle}>Xác Thực Mật Khẩu</Text>
                <Text style={styles.pinDesc}>
                  Nhập mật khẩu để hiển thị {pinTarget === 'primary' ? 'API Key chính' : 'API Key dự phòng'}:
                </Text>

                <TextInput
                  style={[styles.pinInput, Boolean(pinError) && styles.pinInputError]}
                  value={pinInput}
                  onChangeText={(text) => {
                    setPinInput(text);
                    if (pinError) setPinError('');
                    // Tự động mở khóa ngay khi gõ đúng 8888
                    if (text === '8888') {
                      if (pinTarget === 'primary') setShowPrimary(true);
                      if (pinTarget === 'backup') setShowBackup(true);
                      setPinModalVisible(false);
                      setPinInput('');
                    }
                  }}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={10}
                  autoFocus
                />

                {Boolean(pinError) && <Text style={styles.pinErrorText}>{pinError}</Text>}

                <View style={styles.pinBtnRow}>
                  <TouchableOpacity
                    style={styles.pinCancelBtn}
                    onPress={() => {
                      setPinModalVisible(false);
                      setPinInput('');
                      setPinError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pinCancelBtnText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pinConfirmBtn}
                    onPress={handleVerifyPin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pinConfirmBtnText}>Mở Khóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
    position: 'relative',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  securityBox: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0284C7',
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    color: '#7DD3FC',
    lineHeight: 16,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  badgeTextActive: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeRequired: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  badgeTextRequired: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeOptional: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#64748B',
  },
  badgeTextOptional: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    color: '#38BDF8',
    fontSize: 13.5,
  },
  actionBtn: {
    padding: 6,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  eyeIcon: {
    fontSize: 16,
  },
  fieldHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Hộp thoại xác thực mật khẩu 8888 */
  pinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99,
  },
  pinCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  pinIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pinIcon: {
    fontSize: 22,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  pinDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  pinInput: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  pinInputError: {
    borderColor: '#EF4444',
  },
  pinErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  pinBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  pinCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  pinCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  pinConfirmBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
  },
  pinConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
