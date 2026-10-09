import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenCatSettings?: () => void;
  hasApiKey: boolean;
  catEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenCatSettings,
  hasApiKey,
  catEnabled = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.appName}>INVOICE TO EXCEL</Text>
        <Text style={styles.subtitle}>Bóc Tách Hóa Đơn & Xuất Bảng Kê Chuẩn</Text>
      </View>

      <View style={styles.rightButtons}>
        {onOpenCatSettings && (
          <TouchableOpacity
            style={[styles.settingsButton, catEnabled && styles.catActiveButton]}
            onPress={onOpenCatSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsIcon}>🐱</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.settingsButton, !hasApiKey && styles.settingsWarning]}
          onPress={onOpenSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
          {!hasApiKey && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#0F172A', // Dark slate
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8', // Cyan-blue
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catActiveButton: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C4A6E',
  },
  settingsWarning: {
    borderColor: '#F59E0B',
  },
  settingsIcon: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});
