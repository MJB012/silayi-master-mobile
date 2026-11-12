import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ledgerApi } from '@/api/ledger-api';
import { BaseButton } from '@/components/base-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ClientMeasurement, PaymentStatus } from '@/types/measurement';

interface MeasurementDetailModalProps {
  measurement: ClientMeasurement | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (measurement: ClientMeasurement) => void;
  onStatusChange?: (id: string, newStatus: ClientMeasurement['status']) => void;
  onPaymentChange?: (id: string, newPaymentStatus: PaymentStatus) => void;
  shopName?: string;
}

export function MeasurementDetailModal({
  measurement,
  visible,
  onClose,
  onEdit,
  onStatusChange,
  onPaymentChange,
  shopName = 'Silayi Master Tailors',
}: MeasurementDetailModalProps) {
  const theme = useTheme();

  if (!measurement) return null;

  const remainingBalance = measurement.totalAmount - measurement.advanceAmount;

  const handleCall = () => {
    Linking.openURL(`tel:${measurement.clientPhone}`);
  };

  const handleWhatsApp = async () => {
    try {
      if (
        measurement.id &&
        !measurement.id.startsWith('meas-') &&
        !measurement.id.startsWith('current-') &&
        !measurement.id.startsWith('hist-')
      ) {
        const res = await ledgerApi.getWhatsAppSlip(measurement.id);
        if (res?.whatsapp_url) {
          Linking.openURL(res.whatsapp_url);
          return;
        }
      }
    } catch {
      // Fall through to manual formatting below
    }

    const name = measurement.clientName || 'محترم گاہک';
    const balance = remainingBalance || 0;
    const balanceText =
      balance > 0
        ? `بقیہ واجب الادا رقم: *روپے ${balance}*`
        : `بقیہ رقم: *مکمل ادا شدہ*`;

    let text = `*السلام علیکم ${name} صاحب!*\n\n`;
    text += `*${shopName}* کی طرف سے آپ کو مطلع کیا جاتا ہے کہ آپ کا سوٹ سلائی ہو کر تیار ہو چکا ہے۔\n`;
    text += `برائے مہربانی تشریف لا کر اپنا سوٹ وصول فرما لیں۔\n\n`;
    text += `پرچی نمبر: *#${measurement.receiptNumber}*\n`;
    text += `${balanceText}\n\n`;
    text += `شکریہ!`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = measurement.clientPhone.replace(/[\s\-()]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encoded}`);
  };

  const isWaistcoat = measurement.garmentType === 'waistcoat';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <View style={styles.serialBadge}>
                  <Text style={styles.serialBadgeText}>SERIAL #{measurement.serialNumber}</Text>
                </View>
                <Text style={[styles.receiptBadge, { color: '#64748B' }]}>
                  SLIP #{measurement.receiptNumber}
                </Text>
              </View>
              <View style={styles.nameRow}>
                <Text style={[styles.clientName, { color: theme.text }]}>
                  {measurement.clientName}
                </Text>
                <Text style={styles.urduClientBadge}>کھاتہ پرچی</Text>
              </View>
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                Order: {measurement.orderDate} • Due: {measurement.deliveryDate}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Quick Action: Edit & Call */}
            <View style={styles.topActionsRow}>
              <Pressable
                onPress={() => {
                  onClose();
                  onEdit?.(measurement);
                }}
                style={styles.editActionPill}>
                <Ionicons name="create-outline" size={15} color="#1E3A8A" />
                <View style={styles.actionPillTextCol}>
                  <Text style={styles.editActionTextEn}>Edit Sizes</Text>
                  <Text style={styles.editActionTextUr}>سائز میں ترمیم</Text>
                </View>
              </Pressable>

              <Pressable onPress={handleCall} style={styles.phoneActionPill}>
                <Ionicons name="call-outline" size={14} color="#15803D" />
                <Text style={styles.phoneActionText}>{measurement.clientPhone}</Text>
              </Pressable>
            </View>

            {/* 1. Payment Status Tracking & Mark Paid */}
            <View style={[styles.sectionBox, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.boxHeaderRow}>
                <View style={styles.boxTitleRow}>
                  <Ionicons name="cash-outline" size={16} color="#0F172A" />
                  <Text style={styles.boxTitleEn}>Payment Status</Text>
                  <Text style={styles.boxTitleUr}>ادائیگی کی تفصیل</Text>
                </View>

                {/* Mark as paid button */}
                {measurement.paymentStatus !== 'paid' && (
                  <Pressable
                    onPress={() => onPaymentChange?.(measurement.id, 'paid')}
                    style={styles.markPaidBtn}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                    <View style={styles.actionPillTextCol}>
                      <Text style={styles.markPaidTextEn}>Mark Paid</Text>
                      <Text style={styles.markPaidTextUr}>رقم وصول</Text>
                    </View>
                  </Pressable>
                )}
              </View>

              <View style={styles.billingGrid}>
                <View style={styles.billingCol}>
                  <Text style={styles.billingLabel}>Total Bill (کل رقم)</Text>
                  <Text style={styles.billingVal}>Rs. {measurement.totalAmount}</Text>
                </View>
                <View style={styles.billingCol}>
                  <Text style={styles.billingLabel}>Advance (پیشگی رقم)</Text>
                  <Text style={[styles.billingVal, { color: '#15803D' }]}>Rs. {measurement.advanceAmount}</Text>
                </View>
                <View style={styles.billingCol}>
                  <Text style={styles.billingLabel}>Balance Due (بقیہ رقم)</Text>
                  <Text style={[styles.billingVal, { color: remainingBalance > 0 ? '#DC2626' : '#15803D' }]}>
                    {remainingBalance > 0 ? `Rs. ${remainingBalance}` : 'PAID (مکمل)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Customer Stitching History (When did he last stitch?) */}
            <View style={[styles.sectionBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.boxHeaderRow}>
                <View style={styles.boxTitleRow}>
                  <Ionicons name="time-outline" size={16} color="#1E3A8A" />
                  <Text style={styles.boxTitleEn}>Customer Stitching History</Text>
                  <Text style={styles.boxTitleUr}>گاہک کا سابقہ ریکارڈ</Text>
                </View>
                <Text style={styles.lastStitchedBadge}>
                  Last: {measurement.lastStitchedDate}
                </Text>
              </View>

              {measurement.history && measurement.history.length > 0 ? (
                <View style={styles.historyList}>
                  {measurement.history.map((rec, idx) => (
                    <View key={rec.id || idx} style={styles.historyItem}>
                      <View style={styles.historyBullet} />
                      <View style={styles.historyContent}>
                        <View style={styles.historyTop}>
                          <Text style={styles.historyDate}>{rec.stitchedDate}</Text>
                          <View
                            style={[
                              styles.historyPayBadge,
                              {
                                backgroundColor: rec.paymentStatus === 'paid' ? '#DCFCE7' : '#FEE2E2',
                              },
                            ]}>
                            <Text
                              style={[
                                styles.historyPayText,
                                { color: rec.paymentStatus === 'paid' ? '#15803D' : '#DC2626' },
                              ]}>
                              {rec.paymentStatus === 'paid' ? 'PAID • ادا شدہ' : 'UNPAID • غیر ادا'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.historyReceipt}>
                          {rec.garmentType === 'waistcoat'
                            ? 'Waistcoat (واسکٹ)'
                            : rec.garmentType === 'kurta_pajama'
                            ? 'Kurta Pajama (کرتہ پاجامہ)'
                            : 'Shalwar Kameez (شلوار قمیض)'}{' '}
                          • Receipt #{rec.receiptNumber} • Rs. {rec.totalAmount}
                        </Text>
                        {rec.notes && <Text style={styles.historyNotes}>✂️ {rec.notes}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noHistoryText}>This is the customer's first suit order with your shop.</Text>
              )}
            </View>

            {/* 3. Measurement Matrix Table */}
            <View style={[styles.sectionBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.boxHeaderRow}>
                <View style={styles.boxTitleRow}>
                  <Ionicons name="cut-outline" size={16} color="#1E3A8A" />
                  <Text style={styles.boxTitleEn}>
                    {isWaistcoat ? 'Waistcoat Measurements' : 'Kameez Measurements'}
                  </Text>
                  <Text style={styles.boxTitleUr}>
                    {isWaistcoat ? 'واسکٹ سائز' : 'قمیض سائز'}
                  </Text>
                </View>
              </View>

              <View style={styles.gridMatrix}>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabelEn}>Length</Text>
                  <Text style={styles.gridLabelUr}>لمبائی</Text>
                  <Text style={styles.gridVal}>{measurement.kameez.length}"</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabelEn}>Shoulder</Text>
                  <Text style={styles.gridLabelUr}>تیرا</Text>
                  <Text style={styles.gridVal}>{measurement.kameez.shoulder}"</Text>
                </View>
                {!isWaistcoat && (
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabelEn}>Sleeves</Text>
                    <Text style={styles.gridLabelUr}>بازو</Text>
                    <Text style={styles.gridVal}>{measurement.kameez.sleeves}"</Text>
                  </View>
                )}
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabelEn}>Collar</Text>
                  <Text style={styles.gridLabelUr}>گلا</Text>
                  <Text style={styles.gridVal}>{measurement.kameez.collar}"</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabelEn}>Chest</Text>
                  <Text style={styles.gridLabelUr}>چھاتی</Text>
                  <Text style={styles.gridVal}>{measurement.kameez.chest}"</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabelEn}>Waist</Text>
                  <Text style={styles.gridLabelUr}>کمر</Text>
                  <Text style={styles.gridVal}>{measurement.kameez.waist}"</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.gridLabelEn}>Daman</Text>
                  <Text style={styles.gridLabelUr}>گھیرا</Text>
                  <Text style={styles.gridVal}>{measurement.kameez.daman}"</Text>
                </View>
              </View>
            </View>

            {/* Shalwar Measurements (if applicable) */}
            {!isWaistcoat && (
              <View style={[styles.sectionBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.boxHeaderRow}>
                  <View style={styles.boxTitleRow}>
                    <Ionicons name="layers-outline" size={16} color="#1E3A8A" />
                    <Text style={styles.boxTitleEn}>Shalwar / Pajama Measurements</Text>
                    <Text style={styles.boxTitleUr}>شلوار / پاجامہ سائز</Text>
                  </View>
                </View>

                <View style={styles.gridMatrix}>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabelEn}>Length</Text>
                    <Text style={styles.gridLabelUr}>لمبائی</Text>
                    <Text style={styles.gridVal}>{measurement.shalwar.length}"</Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabelEn}>Paoncha</Text>
                    <Text style={styles.gridLabelUr}>پانچہ</Text>
                    <Text style={styles.gridVal}>{measurement.shalwar.paoncha}"</Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.gridLabelEn}>Asan</Text>
                    <Text style={styles.gridLabelUr}>آسن</Text>
                    <Text style={styles.gridVal}>{measurement.shalwar.asan || '-'}"</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Special Instructions */}
            {measurement.styleNotes && (
              <View style={styles.notesBox}>
                <View style={styles.notesHeaderCol}>
                  <Text style={styles.notesTitleEn}>Sewing & Cutting Instructions</Text>
                  <Text style={styles.notesTitleUr}>سلائی ہدایات</Text>
                </View>
                <Text style={styles.notesBody}>{measurement.styleNotes}</Text>
              </View>
            )}

            {/* Quick Share / Call Bar */}
            <View style={styles.actionButtonsRow}>
              <Pressable onPress={handleWhatsApp} style={styles.whatsappBtn}>
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <View style={styles.actionPillTextCol}>
                  <Text style={styles.whatsappBtnEn}>Send WhatsApp Slip</Text>
                  <Text style={styles.whatsappBtnUr}>پرچی بھیجیں</Text>
                </View>
              </Pressable>
            </View>

            <BaseButton
              title="Close Slip"
              subtitle="پرچی بند کریں"
              onPress={onClose}
              variant="outline"
              size="medium"
              style={styles.closeBtnBottom}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  serialBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  serialBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  receiptBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  clientName: {
    fontSize: 19,
    fontWeight: '800',
  },
  urduClientBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  scrollArea: {
    marginTop: Spacing.two,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  editActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionPillTextCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  editActionTextEn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    lineHeight: 13,
  },
  editActionTextUr: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E3A8A',
    lineHeight: 13,
  },
  phoneActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  phoneActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  boxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boxTitleEn: {
    fontSize: 13,
    fontWeight: '700',
  },
  boxTitleUr: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  markPaidTextEn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  markPaidTextUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  billingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  billingCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  billingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  billingVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  lastStitchedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  historyBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3A8A',
    marginTop: 5,
  },
  historyContent: {
    flex: 1,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyPayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  historyPayText: {
    fontSize: 10,
    fontWeight: '800',
  },
  historyReceipt: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noHistoryText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  gridMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridCell: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridLabelEn: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748B',
  },
  gridLabelUr: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  gridVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  notesHeaderCol: {
    marginBottom: 4,
    gap: 1,
  },
  notesTitleEn: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  notesTitleUr: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
  },
  notesBody: {
    fontSize: 12.5,
    color: '#78350F',
    lineHeight: 18,
  },
  actionButtonsRow: {
    marginBottom: Spacing.two,
  },
  whatsappBtn: {
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  whatsappBtnEn: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  whatsappBtnUr: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  closeBtnBottom: {
    marginBottom: Spacing.two,
  },
});
