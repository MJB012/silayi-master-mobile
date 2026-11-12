import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DashboardHeaderProps {
  shopName?: string;
  tailorName?: string;
  onLogout: () => void;
  onAddMeasurement: () => void;
  onOpenLedgerBook?: () => void;
  stats: {
    total: number;
    inProgress: number;
    ready: number;
    delivered: number;
  };
}

export function DashboardHeader({
  shopName = 'Al-Karam Tailors',
  tailorName = 'Master Muhammad Tariq',
  onLogout,
  onAddMeasurement,
  onOpenLedgerBook,
  stats,
}: DashboardHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* 1. Sleek Top Bar (No colliding text, clean layout) */}
      <View style={styles.topBar}>
        <View style={styles.shopIdentity}>
          {/* Shop Brand Icon Squircle */}
          <View style={styles.logoSquircle}>
            <Ionicons name="cut-outline" size={20} color="#FFFFFF" />
          </View>

          <View style={styles.shopTextCol}>
            <View style={styles.shopNameRow}>
              <Text numberOfLines={1} style={[styles.shopName, { color: theme.text }]}>
                {shopName}
              </Text>
              <Text style={styles.urduShopBadge}>الکرم ٹیلرز</Text>
            </View>
            <View style={styles.masterNameRow}>
              <Text style={[styles.masterName, { color: theme.textSecondary }]}>
                {tailorName}
              </Text>
              <Text style={styles.urduMasterBadge}>درزی ماسٹر</Text>
            </View>
          </View>
        </View>

        {/* Minimal, Professional Logout Button */}
        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.btnPressed,
          ]}>
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Exit</Text>
        </Pressable>
      </View>

      {/* 2. Primary Action Bar: Title line 1, Urdu line 2, Buttons line 3 */}
      <View style={[styles.actionBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text numberOfLines={1} style={[styles.actionTitleEn, { color: theme.text }]}>
          Suit Measurement Book
        </Text>
        <Text style={styles.actionTitleUr}>
          گاہکوں کا ریکارڈ اور کھاتہ
        </Text>

        <View style={styles.actionButtonsGroup}>
          {onOpenLedgerBook && (
            <Pressable
              onPress={onOpenLedgerBook}
              style={({ pressed }) => [
                styles.ledgerBookBtn,
                pressed && styles.btnPressed,
              ]}>
              <Ionicons name="book-outline" size={18} color="#1E3A8A" />
              <View style={styles.btnTextCol}>
                <Text style={styles.ledgerBookEn}>Ledgers</Text>
                <Text style={styles.ledgerBookUr}>کھاتہ بک</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={onAddMeasurement}
            style={({ pressed }) => [
              styles.addMeasBtn,
              pressed && styles.btnPressed,
            ]}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <View style={styles.addMeasBtnText}>
              <Text style={styles.addMeasEn}>Add New</Text>
              <Text style={styles.addMeasUr}>نئی پیمائش</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* 3. Clean Metrics Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#0F172A' }]}>{stats.total}</Text>
          <Text style={styles.statLabelEn}>Total Clients</Text>
          <Text style={styles.statLabelUr}>کل گاہک</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#D97706' }]}>{stats.inProgress}</Text>
          <Text style={styles.statLabelEn}>In Stitching</Text>
          <Text style={styles.statLabelUr}>سلائی جاری</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#16A34A' }]}>{stats.ready}</Text>
          <Text style={styles.statLabelEn}>Ready</Text>
          <Text style={styles.statLabelUr}>تیار سوٹ</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#2563EB' }]}>{stats.delivered}</Text>
          <Text style={styles.statLabelEn}>Delivered</Text>
          <Text style={styles.statLabelUr}>حوالے شدہ</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingHorizontal: 2,
    gap: 8,
  },
  shopIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  logoSquircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(30, 58, 138, 0.2)',
      } as any,
    }),
  },
  shopTextCol: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  urduShopBadge: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  masterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  masterName: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  urduMasterBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionBar: {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three + 2,
    marginBottom: Spacing.three,
    gap: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  actionTitleEn: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionTitleUr: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  ledgerBookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 8,
  },
  btnTextCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  ledgerBookEn: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  ledgerBookUr: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 13,
  },
  addMeasBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
  addMeasBtnText: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  addMeasEn: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  addMeasUr: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabelEn: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statLabelUr: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  btnPressed: {
    opacity: 0.8,
  },
});
