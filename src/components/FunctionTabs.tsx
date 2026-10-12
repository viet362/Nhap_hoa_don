import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ActiveTab = 'import_invoices' | 'export_receipts';

interface FunctionTabsProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  invoiceCount?: number;
}

export const FunctionTabs: React.FC<FunctionTabsProps> = ({
  activeTab,
  onChangeTab,
  invoiceCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'import_invoices' && styles.activeTab]}
        onPress={() => onChangeTab('import_invoices')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, activeTab === 'import_invoices' && styles.activeText]}>
          📥
        </Text>
        <View style={styles.tabContent}>
          <Text style={[styles.tabTitle, activeTab === 'import_invoices' && styles.activeText]}>
            Bảng Kê Mua Vào
          </Text>
          <Text style={styles.tabSubtitle}>Ảnh ➔ File Excel</Text>
        </View>
        {invoiceCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{invoiceCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'export_receipts' && styles.activeTab]}
        onPress={() => onChangeTab('export_receipts')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabIcon, activeTab === 'export_receipts' && styles.activeText]}>
          📄
        </Text>
        <View style={styles.tabContent}>
          <Text style={[styles.tabTitle, activeTab === 'export_receipts' && styles.activeText]}>
            Phiếu Thu Bán Ra
          </Text>
          <Text style={styles.tabSubtitle}>Excel ➔ File Word</Text>
        </View>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>Mới</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0B1120',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabSubtitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  activeText: {
    color: '#38BDF8',
  },
  badge: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
