import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AuthHeaderProps {
  title?: string;
  subtitleEn?: string;
  subtitleUr?: string;
}

export function AuthHeader({
  title = 'Silayi Master',
  subtitleEn = 'Bespoke Tailoring Ledger & Measurement Book',
  subtitleUr = 'درزی کھاتہ اور پیمائش بک',
}: AuthHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Official Silayi Master Brand Emblem (Clean Royal Blue Squircle with Scissors) */}
      <View style={styles.iconCircle}>
        <View style={styles.iconInner}>
          <Ionicons name="cut-outline" size={34} color="#FFFFFF" />
        </View>
      </View>

      {/* Brand Title: English & Urdu */}
      <View style={styles.brandTitleRow}>
        <Text style={[styles.brandTitle, { color: theme.text }]}>{title}</Text>
        <Text style={styles.urduBrandTitle}>سیلائی ماسٹر</Text>
      </View>

      {/* Subtitle & Urdu Translation in 2 distinct lines */}
      <View style={styles.subtitleColumn}>
        <Text style={[styles.subtitleEn, { color: theme.textSecondary }]}>
          {subtitleEn}
        </Text>
        <Text style={styles.subtitleUr}>
          {subtitleUr}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingTop: Spacing.two,
  },
  iconCircle: {
    marginBottom: Spacing.two,
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 6px 16px rgba(30, 58, 138, 0.3)',
      } as any,
    }),
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  urduBrandTitle: {
    fontSize: 22,
    color: '#000000',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subtitleColumn: {
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  subtitleEn: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  subtitleUr: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
