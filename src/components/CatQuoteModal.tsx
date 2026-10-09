import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getLocalQuotes,
  saveLocalQuotes,
  syncQuotesWithAiven,
  pushQuoteToCloud,
  deleteQuoteFromCloud,
  getSyncApiUrl,
  setSyncApiUrl,
} from '../services/catQuoteService';

interface CatQuoteModalProps {
  visible: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  quotes: string[];
  onQuotesUpdated: (quotes: string[]) => void;
}

export const CatQuoteModal: React.FC<CatQuoteModalProps> = ({
  visible,
  onClose,
  isEnabled,
  onToggleEnabled,
  quotes,
  onQuotesUpdated,
}) => {
  const [newText, setNewText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ connected?: boolean; message?: string }>({});
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState('/api/cat-quotes');

  useEffect(() => {
    if (visible) {
      getSyncApiUrl().then(setApiUrl);
    }
  }, [visible]);

  const handleAddQuote = async () => {
    const text = newText.trim();
    if (!text) return;

    if (quotes.includes(text)) {
      Alert.alert('Thông báo', 'Câu nói này đã có trong danh sách rồi bạn nhé!');
      return;
    }

    const updated = [text, ...quotes];
    onQuotesUpdated(updated);
    await saveLocalQuotes(updated);
    setNewText('');

    // Đẩy lên cloud ngầm nếu có kết nối
    pushQuoteToCloud(apiUrl, text).catch(() => {});
  };

  const handleDeleteQuote = async (item: string) => {
    if (quotes.length <= 1) {
      Alert.alert('Lưu ý', 'Cần giữ lại ít nhất 1 câu nói cho chú mèo.');
      return;
    }

    const updated = quotes.filter((q) => q !== item);
    onQuotesUpdated(updated);
    await saveLocalQuotes(updated);

    // Xóa trên cloud ngầm
    deleteQuoteFromCloud(apiUrl, item).catch(() => {});
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await syncQuotesWithAiven();
      setSyncStatus({ connected: res.connected, message: res.message });
      if (res.quotes && res.quotes.length > 0) {
        onQuotesUpdated(res.quotes);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveApiUrl = async () => {
    await setSyncApiUrl(apiUrl);
    setShowApiSettings(false);
    handleSyncCloud();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Quản Lý Lời Thoại Mèo 🐱</Text>
              <Text style={styles.subtitle}>Đồng bộ Aiven MySQL dùng chung mọi thiết bị</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Công tắc Bật/Tắt mèo */}
          <View style={styles.switchCard}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Bật chú mèo đồng hành</Text>
              <Text style={styles.switchDesc}>Mèo đi lại ngẫu nhiên và trò chuyện khi bạn chạm vào</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={onToggleEnabled}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor={isEnabled ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          {/* Thanh đồng bộ Cloud */}
          <View style={styles.syncCard}>
            <View style={styles.syncRow}>
              <View style={styles.syncLeft}>
                <Text style={styles.syncTitle}>☁️ Đồng bộ Aiven MySQL</Text>
                <Text style={styles.syncDesc}>
                  {syncStatus.message || 'Mọi thiết bị đều tự động dùng chung kho câu nói này'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
                onPress={handleSyncCloud}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.syncBtnText}>🔄 Đồng Bộ</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.apiConfigToggle}
              onPress={() => setShowApiSettings(!showApiSettings)}
            >
              <Text style={styles.apiConfigToggleText}>
                {showApiSettings ? '▲ Ẩn cấu hình máy chủ' : '⚙️ Tùy chỉnh URL API Máy Chủ'}
              </Text>
            </TouchableOpacity>

            {showApiSettings && (
              <View style={styles.apiUrlSection}>
                <Text style={styles.apiLabel}>URL Netlify Function / API Proxy:</Text>
                <View style={styles.apiUrlRow}>
                  <TextInput
                    style={styles.apiUrlInput}
                    value={apiUrl}
                    onChangeText={setApiUrl}
                    placeholder="/api/cat-quotes"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveApiUrl}>
                    <Text style={styles.saveUrlText}>Lưu</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.apiHint}>
                  💡 Trên web: để nguyên '/api/cat-quotes'. Trên app di động: nhập domain Netlify đầy đủ (vd: https://your-app.netlify.app/api/cat-quotes).
                </Text>
              </View>
            )}
          </View>

          {/* Nhập câu mới */}
          <View style={styles.inputSection}>
            <Text style={styles.inputSectionLabel}>Thêm câu nói mới ({quotes.length} câu hiện có):</Text>
            <View style={styles.addInputRow}>
              <TextInput
                style={styles.addInput}
                value={newText}
                onChangeText={setNewText}
                placeholder="Nhập câu khích lệ, nhắc nhở vui tươi..."
                placeholderTextColor="#64748B"
                returnKeyType="done"
                onSubmitEditing={handleAddQuote}
              />
              <TouchableOpacity
                style={[styles.addBtn, !newText.trim() && styles.addBtnDisabled]}
                onPress={handleAddQuote}
                disabled={!newText.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>+ Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Danh sách các câu */}
          <Text style={styles.listTitle}>DANH SÁCH LỜI THOẠI NGẪU NHIÊN</Text>
          <ScrollView style={styles.quoteListScroll} showsVerticalScrollIndicator={true}>
            {quotes.map((quote, idx) => (
              <View key={`${quote}-${idx}`} style={styles.quoteItem}>
                <View style={styles.quoteItemBadge}>
                  <Text style={styles.quoteItemBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={styles.quoteText}>{quote}</Text>
                <TouchableOpacity
                  style={styles.deleteQuoteBtn}
                  onPress={() => handleDeleteQuote(quote)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteQuoteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Nút đóng */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Xong</Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
  },
  headerRow: {
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
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  switchDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  syncCard: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284C7',
    marginBottom: 12,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncLeft: {
    flex: 1,
    marginRight: 10,
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  syncDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 86,
    alignItems: 'center',
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  apiConfigToggle: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  apiConfigToggleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  apiUrlSection: {
    marginTop: 8,
  },
  apiLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  apiUrlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  apiUrlInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#38BDF8',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveUrlBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  saveUrlText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  apiHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 14,
  },
  inputSection: {
    marginBottom: 10,
  },
  inputSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  quoteListScroll: {
    maxHeight: 160,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  quoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  quoteItemBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quoteItemBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  quoteText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 12.5,
    lineHeight: 17,
  },
  deleteQuoteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  deleteQuoteText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
