import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const measurementCategories = [
    {
      titleEn: 'Kameez / Kurta',
      titleUr: 'قمیض / کرتہ',
      icon: 'shirt-outline' as const,
      fields: [
        { en: 'Length', ur: 'لمبائی' },
        { en: 'Shoulder (Tera)', ur: 'تیرا' },
        { en: 'Sleeves (Bazu)', ur: 'بازو' },
        { en: 'Collar (Gala)', ur: 'گلا' },
        { en: 'Chest (Chati)', ur: 'چھاتی' },
        { en: 'Waist (Kamar)', ur: 'کمر' },
        { en: 'Daman / Ghera', ur: 'گھیرا / دامن' },
      ],
    },
    {
      titleEn: 'Shalwar / Trouser',
      titleUr: 'شلوار / پاجامہ',
      icon: 'layers-outline' as const,
      fields: [
        { en: 'Shalwar Length', ur: 'شلوار لمبائی' },
        { en: 'Waist (Nefa)', ur: 'نیفہ / کمر' },
        { en: 'Bottom (Paoncha)', ur: 'پانچہ' },
        { en: 'Asan (Inseam)', ur: 'آسن / ران' },
      ],
    },
    {
      titleEn: 'Coat / Waistcoat / Sherwani',
      titleUr: 'کوٹ / واسکٹ / شیروانی',
      icon: 'cut-outline' as const,
      fields: [
        { en: 'Coat Length', ur: 'کوٹ لمبائی' },
        { en: 'Chest Cross', ur: 'چھاتی' },
        { en: 'Back Width', ur: 'پشت' },
        { en: 'Waist Fitting', ur: 'کمر' },
        { en: 'Lapel & Style', ur: 'کالر اسٹائل' },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: Math.max(safeAreaInsets.top, Spacing.four),
          paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
        },
      ]}>
      <View style={styles.contentWrapper}>
        {/* Header with English on left, bold black Urdu on right */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.title, { color: theme.text }]}>
              Suit Measurements
            </Text>
            <Text style={styles.urduTitle}>سوٹ کی پیمائش</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Upcoming tailor measurement fields with bilingual labels (English left, Urdu bold black right).
          </Text>
        </View>

        {/* Feature Cards */}
        {measurementCategories.map((cat, idx) => (
          <View
            key={idx}
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconBox}>
                  <Ionicons name={cat.icon} size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{cat.titleEn}</Text>
              </View>
              <Text style={styles.cardTitleUrdu}>{cat.titleUr}</Text>
            </View>

            <View style={styles.fieldsList}>
              {cat.fields.map((field, fIdx) => (
                <View
                  key={fIdx}
                  style={[
                    styles.fieldRow,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}>
                  {/* Left side English */}
                  <Text style={[styles.fieldEn, { color: theme.text }]}>
                    {field.en}
                  </Text>

                  {/* Right side Urdu in bold black */}
                  <Text style={styles.fieldUrdu}>
                    {field.ur}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: BrandColors.accentMuted }]}>
          <Ionicons name="information-circle-outline" size={20} color={BrandColors.accent} />
          <Text style={[styles.infoText, { color: BrandColors.primaryDark }]}>
            All BaseInput labels and headers have English on the left and Urdu in bold black on the right!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 540,
  },
  header: {
    marginBottom: Spacing.four,
    width: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  urduTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      } as any,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardTitleUrdu: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  fieldsList: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldEn: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldUrdu: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  infoBox: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 12,
    marginTop: Spacing.two,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
});
