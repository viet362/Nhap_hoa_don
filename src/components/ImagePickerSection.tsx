import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerSectionProps {
  onImagesSelected: (uris: string[]) => void;
  isLoading: boolean;
  itemCount: number;
}

export const ImagePickerSection: React.FC<ImagePickerSectionProps> = ({
  onImagesSelected,
  isLoading,
  itemCount,
}) => {
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cấp quyền', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn hóa đơn.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 50,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagesSelected(result.assets.map((a) => a.uri));
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể mở thư viện ảnh.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cấp quyền', 'Ứng dụng cần quyền truy cập Camera để chụp ảnh hóa đơn.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagesSelected([result.assets[0].uri]);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể mở camera.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>TẢI ẢNH HÓA ĐƠN ({itemCount} ĐÃ CHỌN)</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={handlePickFromGallery}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnIcon}>🖼️</Text>
          <Text style={styles.btnText}>Chọn từ Thư viện</Text>
          <Text style={styles.btnSubText}>Nhiều ảnh cùng lúc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.cameraBtn]}
          onPress={handleCaptureCamera}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnIcon}>📸</Text>
          <Text style={styles.btnText}>Chụp Camera</Text>
          <Text style={styles.btnSubText}>Chụp từng tờ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#0284C7', // Sky 600
  },
  cameraBtn: {
    backgroundColor: '#0F766E', // Teal 700
  },
  btnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSubText: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.85,
  },
});
