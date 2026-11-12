import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ClientMeasurement } from '@/types/measurement';

interface MeasurementCardProps {
  measurement: ClientMeasurement;
  onPress: () => void;
  onEdit: () => void;
  onNewSuit?: () => void;
}

export function MeasurementCard({ measurement, onPress, onEdit, onNewSuit }: MeasurementCardProps) {
  const theme = useTheme();

  const getStatusBadge = () => {
    switch (measurement.status) {
      case 'in_progress':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
          en: 'In Stitching',
          ur: 'سلائی جاری',
        };
      case 'ready':
        return {
          bg: '#DCFCE7',
          border: '#BBF7D0',
          text: '#15803D',
          en: 'Ready',
          ur: 'تیار سوٹ',
        };
      case 'delivered':
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: '#475569',
          en: 'Delivered',
          ur: 'حوالے شدہ',
        };
    }
  };

  const getPaymentBadge = () => {
    const dueAmount = measurement.totalAmount - measurement.advanceAmount;
    switch (measurement.paymentStatus) {
      case 'paid':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#065F46',
          label: 'PAID • رقم وصول',
        };
      case 'partial':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#B45309',
          label: `DUE Rs. ${dueAmount} • بقیہ رقم`,
        };
      case 'unpaid':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#DC2626',
          label: `UNPAID Rs. ${measurement.totalAmount} • غیر ادا`,
        };
    }
  };

  const getGarmentTitle = () => {
    switch (measurement.garmentType) {
      case 'shalwar_kameez':
        return { en: 'Shalwar Kameez', ur: 'شلوار قمیض' };
      case 'kurta_pajama':
        return { en: 'Kurta Pajama', ur: 'کرتہ پاجامہ' };
      case 'waistcoat':
        return { en: 'Waistcoat', ur: 'واسکٹ' };
    }
  };

  const status = getStatusBadge();
  const payment = getPaymentBadge();
  const garment = getGarmentTitle();

  const handleCall = () => {
    Linking.openURL(`tel:${measurement.clientPhone}`);
  };

  const isWaistcoat = measurement.garmentType === 'waistcoat';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}>
      {/* 1. Client Identity & Status Badges */}
      <View style={styles.topRow}>
        <View style={styles.clientInfoCol}>
          <View style={styles.nameRow}>
            {/* Shopkeeper Serial Number Pill */}
            <View style={styles.serialPill}>
              <Text style={styles.serialPillText}>{measurement.serialNumber}</Text>
            </View>
            <Text style={[styles.clientName, { color: theme.text }]}>
              {measurement.clientName}
            </Text>
            {measurement.urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>
          <Text style={[styles.receiptText, { color: theme.textSecondary }]}>
            Serial: {measurement.serialNumber} • Slip #{measurement.receiptNumber} • Due: {measurement.deliveryDate}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
          <Text style={[styles.statusTextEn, { color: status.text }]}>{status.en}</Text>
          <Text style={styles.statusTextUr}>{status.ur}</Text>
        </View>
      </View>

      {/* 2. Garment Tag & History & Payment Badge */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <View style={[styles.garmentPill, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="shirt-outline" size={13} color="#1E3A8A" />
            <Text style={[styles.garmentEn, { color: theme.text }]}>{garment.en}</Text>
            <Text style={styles.garmentUr}>{garment.ur}</Text>
          </View>

          {/* Last Stitched Date Tag */}
          <View style={styles.historyPill}>
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={styles.historyText}>
              Last: {measurement.lastStitchedDate}
            </Text>
          </View>
        </View>

        {/* Payment Status Badge */}
        <View style={[styles.paymentBadge, { backgroundColor: payment.bg, borderColor: payment.border }]}>
          <Text style={[styles.paymentText, { color: payment.text }]}>{payment.label}</Text>
        </View>
      </View>

      {/* 3. Measurements Section: Divided into Qameez & Shalwar */}
      <View style={[styles.measurementsBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {/* Qameez / Kurta / Waistcoat Measurements Block */}
        <View style={styles.subGarmentBlock}>
          <View style={styles.subGarmentHeader}>
            <View style={styles.subGarmentBadge}>
              <Ionicons name="shirt-outline" size={11} color="#1E3A8A" />
              <Text style={styles.subGarmentEn}>
                {measurement.garmentType === 'kurta_pajama'
                  ? 'Kurta'
                  : isWaistcoat
                  ? 'Waistcoat'
                  : 'Qameez'}
              </Text>
              <Text style={styles.subGarmentUr}>
                {measurement.garmentType === 'kurta_pajama'
                  ? 'کرتہ سائز'
                  : isWaistcoat
                  ? 'واسکٹ سائز'
                  : 'قمیض سائز'}
              </Text>
            </View>
          </View>

          <View style={styles.measurementsGrid}>
            <View style={styles.measChip}>
              <Text style={styles.measLabelEn}>Length</Text>
              <Text style={styles.measLabelUr}>لمبائی</Text>
              <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.length || '-'}"</Text>
            </View>
            <View style={styles.measDivider} />
            <View style={styles.measChip}>
              <Text style={styles.measLabelEn}>Tera</Text>
              <Text style={styles.measLabelUr}>تیرا</Text>
              <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.shoulder || '-'}"</Text>
            </View>
            <View style={styles.measDivider} />
            <View style={styles.measChip}>
              <Text style={styles.measLabelEn}>Chest</Text>
              <Text style={styles.measLabelUr}>چھاتی</Text>
              <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.chest || '-'}"</Text>
            </View>

            {!isWaistcoat ? (
              <>
                <View style={styles.measDivider} />
                <View style={styles.measChip}>
                  <Text style={styles.measLabelEn}>Sleeves</Text>
                  <Text style={styles.measLabelUr}>بازو</Text>
                  <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.sleeves || '-'}"</Text>
                </View>
                {Boolean(measurement.kameez.collar && measurement.kameez.collar !== '0') && (
                  <>
                    <View style={styles.measDivider} />
                    <View style={styles.measChip}>
                      <Text style={styles.measLabelEn}>Collar</Text>
                      <Text style={styles.measLabelUr}>گلا</Text>
                      <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.collar}"</Text>
                    </View>
                  </>
                )}
                {Boolean(measurement.kameez.daman && measurement.kameez.daman !== '0') && (
                  <>
                    <View style={styles.measDivider} />
                    <View style={styles.measChip}>
                      <Text style={styles.measLabelEn}>Daman</Text>
                      <Text style={styles.measLabelUr}>دامن</Text>
                      <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.daman}"</Text>
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                {Boolean(measurement.kameez.waist && measurement.kameez.waist !== '0') && (
                  <>
                    <View style={styles.measDivider} />
                    <View style={styles.measChip}>
                      <Text style={styles.measLabelEn}>Waist</Text>
                      <Text style={styles.measLabelUr}>کمر</Text>
                      <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.waist}"</Text>
                    </View>
                  </>
                )}
                {Boolean(measurement.kameez.collar && measurement.kameez.collar !== '0') && (
                  <>
                    <View style={styles.measDivider} />
                    <View style={styles.measChip}>
                      <Text style={styles.measLabelEn}>Collar</Text>
                      <Text style={styles.measLabelUr}>گلا</Text>
                      <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.collar}"</Text>
                    </View>
                  </>
                )}
                {Boolean(measurement.kameez.daman && measurement.kameez.daman !== '0') && (
                  <>
                    <View style={styles.measDivider} />
                    <View style={styles.measChip}>
                      <Text style={styles.measLabelEn}>Daman</Text>
                      <Text style={styles.measLabelUr}>دامن</Text>
                      <Text style={[styles.measVal, { color: theme.text }]}>{measurement.kameez.daman}"</Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {/* Shalwar / Pajama Measurements Block */}
        {!isWaistcoat && (
          <View style={styles.shalwarBlock}>
            <View style={styles.subGarmentHeader}>
              <View style={[styles.subGarmentBadge, styles.shalwarBadge]}>
                <Ionicons name="cut-outline" size={11} color="#0D9488" />
                <Text style={[styles.subGarmentEn, { color: '#0F766E' }]}>
                  {measurement.garmentType === 'kurta_pajama' ? 'Pajama' : 'Shalwar'}
                </Text>
                <Text style={styles.subGarmentUr}>
                  {measurement.garmentType === 'kurta_pajama' ? 'پاجامہ سائز' : 'شلوار سائز'}
                </Text>
              </View>
            </View>

            <View style={styles.measurementsGrid}>
              <View style={styles.measChip}>
                <Text style={styles.measLabelEn}>Length</Text>
                <Text style={styles.measLabelUr}>لمبائی</Text>
                <Text style={[styles.measVal, { color: theme.text }]}>{measurement.shalwar.length || '-'}"</Text>
              </View>
              <View style={styles.measDivider} />
              <View style={styles.measChip}>
                <Text style={styles.measLabelEn}>Paoncha</Text>
                <Text style={styles.measLabelUr}>پانچہ</Text>
                <Text style={[styles.measVal, { color: theme.text }]}>{measurement.shalwar.paoncha || '-'}"</Text>
              </View>
              {Boolean(measurement.shalwar.asan && measurement.shalwar.asan !== '0') && (
                <>
                  <View style={styles.measDivider} />
                  <View style={styles.measChip}>
                    <Text style={styles.measLabelEn}>Asan</Text>
                    <Text style={styles.measLabelUr}>آسن</Text>
                    <Text style={[styles.measVal, { color: theme.text }]}>{measurement.shalwar.asan}"</Text>
                  </View>
                </>
              )}
              {Boolean(measurement.shalwar.waist && measurement.shalwar.waist !== '0') && (
                <>
                  <View style={styles.measDivider} />
                  <View style={styles.measChip}>
                    <Text style={styles.measLabelEn}>Ghera / Waist</Text>
                    <Text style={styles.measLabelUr}>گھیرا</Text>
                    <Text style={[styles.measVal, { color: theme.text }]}>{measurement.shalwar.waist}"</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Style note snippet if present */}
      {measurement.styleNotes && (
        <Text
          numberOfLines={1}
          style={[styles.styleNoteSnippet, { color: theme.textSecondary }]}>
          ✂️ {measurement.styleNotes}
        </Text>
      )}

      {/* 4. Action Row: Edit, Ledger History, Call */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleCall}
          style={styles.phoneButton}>
          <Ionicons name="call-outline" size={13} color="#1E3A8A" />
          <Text style={styles.phoneText}>{measurement.clientPhone}</Text>
        </Pressable>

        <View style={styles.actionButtonsCol}>
          {/* Add New Suit for returning client */}
          {onNewSuit && (
            <Pressable onPress={onNewSuit} style={styles.newSuitBtn}>
              <Ionicons name="add" size={13} color="#1E3A8A" />
              <View style={styles.btnTextCol}>
                <Text style={styles.newSuitBtnEn}>+Suit</Text>
                <Text style={styles.newSuitBtnUr}>نیا سوٹ</Text>
              </View>
            </Pressable>
          )}

          {/* Edit Measurement Button */}
          <Pressable
            onPress={onEdit}
            style={styles.editBtn}>
            <Ionicons name="create-outline" size={14} color="#1E3A8A" />
            <View style={styles.btnTextCol}>
              <Text style={styles.editBtnEn}>Edit</Text>
              <Text style={styles.editBtnUr}>ترمیم</Text>
            </View>
          </Pressable>

          {/* Full Ledger & History Button */}
          <Pressable
            onPress={onPress}
            style={styles.ledgerBtn}>
            <View style={styles.btnTextCol}>
              <Text style={styles.ledgerBtnEn}>Ledger</Text>
              <Text style={styles.ledgerBtnUr}>کھاتہ</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three + 2,
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      } as any,
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientInfoCol: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serialPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serialPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  urgentText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  receiptText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusTextEn: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextUr: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  garmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  garmentEn: {
    fontSize: 11,
    fontWeight: '600',
  },
  garmentUr: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
  },
  historyText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  paymentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  paymentText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  measurementsBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  subGarmentBlock: {
    width: '100%',
  },
  subGarmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subGarmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shalwarBadge: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  subGarmentEn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  subGarmentUr: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  shalwarBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  measurementsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  measChip: {
    flex: 1,
    alignItems: 'center',
  },
  measLabelEn: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748B',
  },
  measLabelUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  measVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  measDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
  },
  styleNoteSnippet: {
    fontSize: 11.5,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  actionButtonsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newSuitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  newSuitBtnEn: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
    lineHeight: 12,
  },
  newSuitBtnUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  btnTextCol: {
    alignItems: 'flex-start',
    gap: 1,
  },
  editBtnEn: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E3A8A',
    lineHeight: 12,
  },
  editBtnUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 12,
  },
  ledgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  ledgerBtnEn: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  ledgerBtnUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 12,
  },
});
