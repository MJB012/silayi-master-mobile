import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BaseButton } from '@/components/base-button';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (formattedDate: string) => void;
  initialDate?: string;
  title?: string;
  urduTitle?: string;
  minDate?: Date;
}

const URDU_MONTH_NAMES = [
  'جنوری',
  'فروری',
  'مارچ',
  'اپریل',
  'مئی',
  'جون',
  'جولائی',
  'اگست',
  'ستمبر',
  'اکتوبر',
  'نومبر',
  'دسمبر',
];

const ENG_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = [
  { en: 'Su', ur: 'اتوار' },
  { en: 'Mo', ur: 'پیر' },
  { en: 'Tu', ur: 'منگل' },
  { en: 'We', ur: 'بدھ' },
  { en: 'Th', ur: 'جمعرات' },
  { en: 'Fr', ur: 'جمعہ' },
  { en: 'Sa', ur: 'ہفتہ' },
];

/**
 * Robust date parser handling 'DD MMM YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', etc.
 */
export function parseDateString(str?: string): Date {
  if (!str) return new Date();
  const parts = str.trim().split(/[\s\-\/\.]+/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parts[1];
    const y = parseInt(parts[2], 10);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.indexOf(m.toLowerCase().substring(0, 3));
    if (monthIndex !== -1 && !isNaN(d) && !isNaN(y)) {
      return new Date(y, monthIndex, d);
    }
    // Check if parts[2] is month name
    const monthIndex2 = months.indexOf(parts[2].toLowerCase().substring(0, 3));
    if (monthIndex2 !== -1 && !isNaN(d) && !isNaN(parseInt(parts[0], 10))) {
      return new Date(parseInt(parts[0], 10), monthIndex2, parseInt(parts[1], 10));
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
}

/**
 * Formats a Date object to standard tailor format: '05 Nov 2026'
 */
export function formatDateToString(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function CalendarPickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Due Date',
  urduTitle = 'ڈیلیوری تاریخ منتخب کریں',
  minDate,
}: CalendarPickerModalProps) {
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDateString(initialDate));
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth()); // 0-indexed

  // Sync when initialDate changes or modal opens
  useEffect(() => {
    if (visible) {
      const parsed = parseDateString(initialDate);
      setSelectedDate(parsed);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [visible, initialDate]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick delivery days offset from today
  const handleQuickAddDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setSelectedDate(target);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);

    const min = minDate ? new Date(minDate) : null;
    if (min) min.setHours(0, 0, 0, 0);

    // 1. Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      prevDate.setHours(0, 0, 0, 0);
      days.push({
        date: prevDate,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: prevDate.getTime() === today.getTime(),
        isSelected: prevDate.getTime() === sel.getTime(),
        isDisabled: min ? prevDate.getTime() < min.getTime() : false,
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const currDate = new Date(viewYear, viewMonth, i);
      currDate.setHours(0, 0, 0, 0);
      days.push({
        date: currDate,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: currDate.getTime() === today.getTime(),
        isSelected: currDate.getTime() === sel.getTime(),
        isDisabled: min ? currDate.getTime() < min.getTime() : false,
      });
    }

    // 3. Next month leading days (fill to 35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      nextDate.setHours(0, 0, 0, 0);
      days.push({
        date: nextDate,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: nextDate.getTime() === today.getTime(),
        isSelected: nextDate.getTime() === sel.getTime(),
        isDisabled: min ? nextDate.getTime() < min.getTime() : false,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, minDate]);

  // Relative days calculation
  const relativeDaysText = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { en: 'Today', ur: 'آج' };
    if (diffDays === 1) return { en: 'Tomorrow (1 day)', ur: 'کل (1 دن بعد)' };
    if (diffDays === -1) return { en: 'Yesterday', ur: 'گزشتہ کل' };
    if (diffDays > 0) return { en: `In ${diffDays} days`, ur: `${diffDays} دن بعد` };
    return { en: `${Math.abs(diffDays)} days ago`, ur: `${Math.abs(diffDays)} دن پہلے` };
  }, [selectedDate]);

  const handleConfirm = () => {
    onSelectDate(formatDateToString(selectedDate));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={onClose} />

        <View
          style={[
            styles.calendarCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <View style={styles.titleWithIcon}>
                <Ionicons name="calendar" size={20} color="#1E3A8A" />
                <Text style={[styles.headerTitleEn, { color: theme.text }]}>
                  {title}
                </Text>
              </View>
              <Text style={styles.headerTitleUr}>{urduTitle}</Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Tailor Presets */}
          <View style={styles.presetsSection}>
            <Text style={[styles.presetsSectionLabel, { color: theme.textSecondary }]}>
              Quick Delivery Presets • فوری ڈیلیوری دن:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsScroll}>
              {[
                { days: 3, labelEn: '+3 Days', labelUr: '3 دن' },
                { days: 5, labelEn: '+5 Days', labelUr: '5 دن' },
                { days: 7, labelEn: '1 Week (+7d)', labelUr: 'ایک ہفتہ' },
                { days: 10, labelEn: '+10 Days', labelUr: '10 دن' },
                { days: 14, labelEn: '2 Weeks (+14d)', labelUr: 'دو ہفتے' },
                { days: 21, labelEn: '3 Weeks (+21d)', labelUr: '3 ہفتے' },
              ].map((preset) => {
                const target = new Date();
                target.setDate(target.getDate() + preset.days);
                target.setHours(0, 0, 0, 0);

                const currentSel = new Date(selectedDate);
                currentSel.setHours(0, 0, 0, 0);

                const isPresSelected = target.getTime() === currentSel.getTime();

                return (
                  <Pressable
                    key={preset.days}
                    onPress={() => handleQuickAddDays(preset.days)}
                    style={[
                      styles.presetChip,
                      isPresSelected && styles.presetChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.presetChipTextEn,
                        isPresSelected && styles.presetChipTextActive,
                      ]}>
                      {preset.labelEn}
                    </Text>
                    <Text
                      style={[
                        styles.presetChipTextUr,
                        isPresSelected && styles.presetChipTextActive,
                      ]}>
                      {preset.labelUr}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Month & Year Navigation Bar */}
          <View style={styles.monthNavBar}>
            <Pressable
              onPress={handlePrevMonth}
              hitSlop={8}
              style={styles.navArrowBtn}>
              <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
            </Pressable>

            <View style={styles.monthNameCol}>
              <Text style={[styles.monthNameEn, { color: theme.text }]}>
                {ENG_MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Text style={styles.monthNameUr}>
                {URDU_MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
            </View>

            <Pressable
              onPress={handleNextMonth}
              hitSlop={8}
              style={styles.navArrowBtn}>
              <Ionicons name="chevron-forward" size={20} color="#1E3A8A" />
            </Pressable>
          </View>

          {/* Weekday Labels Header */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((wd, idx) => (
              <View key={idx} style={styles.weekdayCell}>
                <Text style={styles.weekdayTextEn}>{wd.en}</Text>
                <Text style={styles.weekdayTextUr}>{wd.ur}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid (7 columns) */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              return (
                <Pressable
                  key={index}
                  disabled={item.isDisabled}
                  onPress={() => {
                    setSelectedDate(item.date);
                    if (!item.isCurrentMonth) {
                      setViewYear(item.date.getFullYear());
                      setViewMonth(item.date.getMonth());
                    }
                  }}
                  style={[
                    styles.dayCell,
                    item.isToday && !item.isSelected && styles.dayCellToday,
                    item.isSelected && styles.dayCellSelected,
                    item.isDisabled && styles.dayCellDisabled,
                  ]}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      { color: item.isCurrentMonth ? theme.text : '#94A3B8' },
                      item.isToday && !item.isSelected && styles.dayNumberToday,
                      item.isSelected && styles.dayNumberSelected,
                      item.isDisabled && styles.dayNumberDisabled,
                    ]}>
                    {item.dayNumber}
                  </Text>
                  {item.isToday && !item.isSelected && (
                    <View style={styles.todayDot} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Selected Date Summary Banner */}
          <View style={[styles.selectedBanner, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.bannerIconCol}>
              <Ionicons name="checkmark-circle" size={22} color="#1E3A8A" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={[styles.bannerTitleEn, { color: theme.text }]}>
                Selected: {formatDateToString(selectedDate)} ({relativeDaysText.en})
              </Text>
              <Text style={styles.bannerTitleUr}>
                ڈیلیوری تاریخ: {formatDateToString(selectedDate)} ({relativeDaysText.ur})
              </Text>
            </View>
          </View>

          {/* Action Buttons: Confirm & Cancel */}
          <View style={styles.actionsRow}>
            <BaseButton
              title="Cancel"
              subtitle="منسوخ"
              onPress={onClose}
              variant="outline"
              size="medium"
              style={styles.actionBtnCancel}
            />
            <BaseButton
              title="Set Due Date"
              subtitle="تاریخ منتخب کریں"
              onPress={handleConfirm}
              variant="primary"
              size="medium"
              icon="calendar"
              style={styles.actionBtnConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFill,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
      } as any,
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  headerTitleCol: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleEn: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerTitleUr: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  presetsSection: {
    marginBottom: Spacing.two,
  },
  presetsSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  presetChipTextEn: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  presetChipTextUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  monthNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  navArrowBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthNameCol: {
    alignItems: 'center',
  },
  monthNameEn: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  monthNameUr: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekdayTextEn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  weekdayTextUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.two,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 1.5,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  dayCellSelected: {
    backgroundColor: '#1E3A8A',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayNumberToday: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayNumberDisabled: {
    color: '#CBD5E1',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E3A8A',
    position: 'absolute',
    bottom: 3,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: Spacing.three,
  },
  bannerIconCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitleEn: {
    fontSize: 12,
    fontWeight: '700',
  },
  bannerTitleUr: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnCancel: {
    flex: 1,
  },
  actionBtnConfirm: {
    flex: 1.6,
  },
});
