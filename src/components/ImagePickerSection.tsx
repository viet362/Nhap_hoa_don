import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
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
  // Xác định môi trường: CHỈ hiển thị và áp dụng tính năng kéo thả khi đang dùng trên MÁY TÍNH (Desktop Web).
  // Trên điện thoại (Mobile / Tablet / WebView), phần này hoàn toàn không áp dụng và không hiển thị.
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || ''
    );
    return !isMobileUA && window.innerWidth >= 768;
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const checkDevice = () => {
      const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ''
      );
      setIsDesktop(!isMobileUA && window.innerWidth >= 768);
    };

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Xử lý các tệp ảnh được kéo thả hoặc chọn từ máy tính
  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const imageFiles = files.filter(
      (f) =>
        f.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|bmp|gif|heic)$/i.test(f.name)
    );

    if (imageFiles.length === 0) {
      Alert.alert(
        'Tệp không hợp lệ',
        'Vui lòng kéo thả hoặc chọn các tệp hình ảnh (PNG, JPG, JPEG, WEBP).'
      );
      return;
    }

    const uris = imageFiles.map((file) => URL.createObjectURL(file));
    onImagesSelected(uris);
  };

  // Bắt sự kiện kéo thả tệp trên toàn bộ cửa sổ trình duyệt máy tính
  useEffect(() => {
    if (!isDesktop || typeof window === 'undefined') return;

    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        dragCounter++;
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
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
  }, [isDesktop]);

  const handlePickFromGallery = async () => {
    // Trên máy tính: Ưu tiên mở hộp thoại chọn tệp đa năng của hệ điều hành
    if (isDesktop && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
      return;
    }

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

  const handleFileInputChange = (e: any) => {
    if (e.target && e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>TẢI ẢNH HÓA ĐƠN ({itemCount} ĐÃ CHỌN)</Text>

      {/* Input ẩn phục vụ chọn tệp trên Web Desktop */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      )}

      {/* ⭐️ KHU VỰC KÉO THẢ: CHỈ ÁP DỤNG & HIỂN THỊ KHI DÙNG TRÊN MÁY TÍNH */}
      {isDesktop && (
        <TouchableOpacity
          style={[
            styles.dropzone,
            isDragging && styles.dropzoneActive,
          ]}
          onPress={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
              fileInputRef.current.click();
            }
          }}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <View style={styles.dropzoneContent}>
            <Text style={styles.dropzoneIcon}>{isDragging ? '📂' : '📥'}</Text>
            <Text style={[styles.dropzoneTitle, isDragging && styles.dropzoneTitleActive]}>
              {isDragging
                ? 'THẢ ẢNH TẠI ĐÂY ĐỂ TẢI LÊN NGAY!'
                : 'KÉO VÀ THẢ ẢNH HÓA ĐƠN VÀO ĐÂY'}
            </Text>
            <Text style={styles.dropzoneSubText}>
              hoặc nhấp chuột để chọn nhiều file từ máy tính (PNG, JPG, JPEG, WEBP)
            </Text>
            <View style={styles.dropzoneBadge}>
              <Text style={styles.dropzoneBadgeText}>⚡ Tự động nhận diện hóa đơn hàng loạt</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={handlePickFromGallery}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnIcon}>🖼️</Text>
          <Text style={styles.btnText}>
            {isDesktop ? 'Chọn tệp từ máy tính' : 'Chọn từ Thư viện'}
          </Text>
          <Text style={styles.btnSubText}>Nhiều ảnh cùng lúc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.cameraBtn]}
          onPress={handleCaptureCamera}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnIcon}>📸</Text>
          <Text style={styles.btnText}>
            {isDesktop ? 'Chụp từ Webcam' : 'Chụp Camera'}
          </Text>
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
  dropzone: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#475569',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dropzoneActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  dropzoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneIcon: {
    fontSize: 34,
    marginBottom: 6,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  dropzoneTitleActive: {
    color: '#38BDF8',
  },
  dropzoneSubText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 8,
  },
  dropzoneBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  dropzoneBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
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
