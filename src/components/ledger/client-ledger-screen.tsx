import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ledgerApi } from '@/api/ledger-api';
import { measurementsApi } from '@/api/measurements-api';
import { BaseButton } from '@/components/base-button';
import { BaseInput } from '@/components/base-input';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ClientMeasurement,
  GarmentType,
  KameezMeasurements,
  PaymentStatus,
  ShalwarMeasurements,
} from '@/types/measurement';

export interface ClientLedgerScreenProps {
  /** The selected client whose ledger is being viewed */
  client: ClientMeasurement;
  /** Full list of clients to allow switching and searching */
  allClients?: ClientMeasurement[];
  /** Back to Dashboard callback */
  onBack: () => void;
  /** Client switch callback */
  onSelectClient?: (client: ClientMeasurement) => void;
  /** Mark payment status callback */
  onPaymentChange?: (clientId: string, newPaymentStatus: PaymentStatus) => void;
  /** Add a new suit order for this client */
  onAddNewOrder?: (client: ClientMeasurement) => void;
  /** Edit an existing order/slip for this client */
  onEditOrder?: (order: ClientMeasurement) => void;
  /** Shop name */
  shopName?: string;
  /** Tailor name */
  tailorName?: string;
}

export interface UnifiedLedgerItem {
  id: string;
  isLatest: boolean;
  date: string;
  receiptNumber: string;
  garmentType: GarmentType;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  kameez: KameezMeasurements;
  shalwar: ShalwarMeasurements;
}

type GarmentFilter = 'all' | GarmentType;
type PaymentFilter = 'all' | PaymentStatus;

export function ClientLedgerScreen({
  client,
  allClients = [],
  onBack,
  onSelectClient,
  onPaymentChange,
  onAddNewOrder,
  onEditOrder,
  shopName = 'Al-Karam Tailors',
  tailorName = 'Master Muhammad Tariq',
}: ClientLedgerScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // State
  const [activeClient, setActiveClient] = useState<ClientMeasurement>(client);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGarment, setSelectedGarment] = useState<GarmentFilter>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentFilter>('all');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [remoteSummary, setRemoteSummary] = useState<{
    total_suits: number;
    total_billed: number;
    total_paid: number;
    total_balance: number;
  } | null>(null);

  // Keep active client in sync if prop changes
  React.useEffect(() => {
    setActiveClient(client);
  }, [client]);

  // Fetch live ledger summary from backend if available
  useEffect(() => {
    if (activeClient.id && !activeClient.id.startsWith('meas-')) {
      ledgerApi
        .getClientLedger(activeClient.id)
        .then((res) => {
          if (res?.summary) {
            setRemoteSummary(res.summary);
          }
        })
        .catch(() => {});
    }
  }, [activeClient.id]);

  // Construct complete chronological ledger list with LATEST order at the top
  const unifiedLedgerList: UnifiedLedgerItem[] = useMemo(() => {
    const list: UnifiedLedgerItem[] = [];

    // 1. Current / Latest order always at the TOP
    const currentBalance = activeClient.totalAmount - activeClient.advanceAmount;
    list.push({
      id: `current-${activeClient.id}`,
      isLatest: true,
      date: activeClient.orderDate,
      receiptNumber: activeClient.receiptNumber,
      garmentType: activeClient.garmentType,
      totalAmount: activeClient.totalAmount,
      paidAmount: activeClient.advanceAmount,
      balanceAmount: Math.max(0, currentBalance),
      paymentStatus: activeClient.paymentStatus,
      notes: activeClient.styleNotes,
      kameez: activeClient.kameez,
      shalwar: activeClient.shalwar,
    });

    // 2. Historical records (reverse chronological order)
    if (activeClient.history && activeClient.history.length > 0) {
      activeClient.history.forEach((hist) => {
        const histBalance = hist.totalAmount - hist.paidAmount;
        list.push({
          id: hist.id,
          isLatest: false,
          date: hist.stitchedDate,
          receiptNumber: hist.receiptNumber,
          garmentType: hist.garmentType,
          totalAmount: hist.totalAmount,
          paidAmount: hist.paidAmount,
          balanceAmount: Math.max(0, histBalance),
          paymentStatus: hist.paymentStatus,
          notes: hist.notes,
          kameez: hist.kameez || activeClient.kameez,
          shalwar: hist.shalwar || activeClient.shalwar,
        });
      });
    }

    return list;
  }, [activeClient]);

  // Client Financial Overview Summary calculations
  const summaryStats = useMemo(() => {
    if (remoteSummary) {
      return {
        totalSuits: remoteSummary.total_suits,
        totalBilled: remoteSummary.total_billed,
        totalPaid: remoteSummary.total_paid,
        totalBalance: remoteSummary.total_balance,
      };
    }

    const totalSuits = unifiedLedgerList.length;
    const totalBilled = unifiedLedgerList.reduce((acc, item) => acc + item.totalAmount, 0);
    const totalPaid = unifiedLedgerList.reduce((acc, item) => acc + item.paidAmount, 0);
    const totalBalance = Math.max(0, totalBilled - totalPaid);

    return {
      totalSuits,
      totalBilled,
      totalPaid,
      totalBalance,
    };
  }, [remoteSummary, unifiedLedgerList]);

  // Filtered ledger records based on search query, garment category, and payment status
  const filteredLedger = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return unifiedLedgerList.filter((item) => {
      // 1. Garment category filter
      if (selectedGarment !== 'all' && item.garmentType !== selectedGarment) {
        return false;
      }

      // 2. Payment status filter
      if (selectedPayment !== 'all') {
        if (selectedPayment === 'paid' && item.paymentStatus !== 'paid') return false;
        if (selectedPayment === 'partial' && item.paymentStatus !== 'partial') return false;
        if (selectedPayment === 'unpaid' && item.paymentStatus !== 'unpaid') return false;
      }

      // 3. Search query filter
      if (q) {
        const matchReceipt = item.receiptNumber.toLowerCase().includes(q);
        const matchDate = item.date.toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchGarment = item.garmentType.toLowerCase().includes(q);
        const matchAmount = String(item.totalAmount).includes(q) || String(item.paidAmount).includes(q);

        return matchReceipt || matchDate || matchNotes || matchGarment || matchAmount;
      }

      return true;
    });
  }, [unifiedLedgerList, searchQuery, selectedGarment, selectedPayment]);

  // Filtered clients list for the client switcher
  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return allClients;
    return allClients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.clientPhone.includes(q) ||
        (c.serialNumber || '').toLowerCase().includes(q)
    );
  }, [allClients, clientSearch]);

  // Client switcher handler
  const handleSwitchClient = (c: ClientMeasurement) => {
    setActiveClient(c);
    onSelectClient?.(c);
    setShowClientPicker(false);
  };

  // Edit order handler: converts ledger item to ClientMeasurement for editing
  const handleEditOrder = (item: UnifiedLedgerItem) => {
    const orderToEdit: ClientMeasurement = {
      ...activeClient,
      id: item.isLatest ? activeClient.id : item.id,
      orderDate: item.date,
      receiptNumber: item.receiptNumber,
      garmentType: item.garmentType,
      totalAmount: item.totalAmount,
      advanceAmount: item.paidAmount,
      paymentStatus: item.paymentStatus,
      styleNotes: item.notes || activeClient.styleNotes,
      kameez: item.kameez,
      shalwar: item.shalwar,
    };
    onEditOrder?.(orderToEdit);
  };

  // Direct phone call
  const handleCall = () => {
    Linking.openURL(`tel:${activeClient.clientPhone}`);
  };

  // WhatsApp full ledger statement: try backend generated URL first, fallback to client-side format
  const handleWhatsAppFullStatement = async () => {
    try {
      if (activeClient.id && !activeClient.id.startsWith('meas-')) {
        const res = await ledgerApi.getWhatsAppSummary(activeClient.id);
        if (res?.whatsapp_url) {
          Linking.openURL(res.whatsapp_url);
          return;
        }
      }
    } catch {
      // Fall through to manual formatting below
    }

    let msg = `*السلام علیکم ${activeClient.clientName} صاحب!*\n`;
    msg += `*${shopName}* (درزی ماسٹر: ${tailorName})\n`;
    msg += `سیریل نمبر: *${activeClient.serialNumber}*\n`;
    msg += `------------------------------------\n`;
    msg += `*آپ کا سوٹ کھاتہ اور آرڈر ریکارڈ:*\n`;

    unifiedLedgerList.forEach((item, idx) => {
      const gName =
        item.garmentType === 'waistcoat'
          ? 'واسکٹ'
          : item.garmentType === 'kurta_pajama'
          ? 'کرتہ پاجامہ'
          : 'شلوار قمیض';
      msg += `\n${idx + 1}. *${gName}* (${item.date})\n`;
      msg += `   پرچی نمبر: #${item.receiptNumber}\n`;
      msg += `   کل بل: روپے ${item.totalAmount} | ادا: روپے ${item.paidAmount}\n`;
      if (item.balanceAmount > 0) {
        msg += `   *بقیہ واجب الادا:* روپے ${item.balanceAmount}\n`;
      } else {
        msg += `   سٹیٹس: *مکمل ادا شدہ*\n`;
      }
    });

    msg += `------------------------------------\n`;
    msg += `*کل تیار سوٹ:* ${summaryStats.totalSuits}\n`;
    msg += `*کل بل رقم:* روپے ${summaryStats.totalBilled}\n`;
    msg += `*کل وصول شدہ:* روپے ${summaryStats.totalPaid}\n`;
    msg += `*کل واجب الادا رقم:* روپے ${summaryStats.totalBalance}\n`;
    msg += `\nشکریہ! آپ کے اعتماد کے مشکور ہیں۔`;

    const encoded = encodeURIComponent(msg);
    Linking.openURL(`https://wa.me/${activeClient.clientPhone.replace(/[\s\-]/g, '')}?text=${encoded}`);
  };

  // WhatsApp single slip: try backend generated URL first, fallback to client-side format
  const handleWhatsAppSingleSlip = async (item: UnifiedLedgerItem) => {
    const rawId = item.isLatest ? activeClient.id : item.id;
    try {
      if (
        rawId &&
        !rawId.startsWith('meas-') &&
        !rawId.startsWith('current-') &&
        !rawId.startsWith('hist-')
      ) {
        const res = await ledgerApi.getWhatsAppSlip(rawId);
        if (res?.whatsapp_url) {
          Linking.openURL(res.whatsapp_url);
          return;
        }
      }
    } catch {
      // Fall through to manual formatting below
    }

    const name = activeClient.clientName || 'محترم گاہک';
    const balance = item.balanceAmount || 0;
    const balanceText =
      balance > 0
        ? `بقیہ واجب الادا رقم: *روپے ${balance}*`
        : `بقیہ رقم: *مکمل ادا شدہ*`;

    let msg = `*السلام علیکم ${name} صاحب!*\n\n`;
    msg += `*${shopName}* کی طرف سے آپ کو مطلع کیا جاتا ہے کہ آپ کا سوٹ سلائی ہو کر تیار ہو چکا ہے۔\n`;
    msg += `برائے مہربانی تشریف لا کر اپنا سوٹ وصول فرما لیں۔\n\n`;
    msg += `پرچی نمبر: *#${item.receiptNumber}*\n`;
    msg += `${balanceText}\n\n`;
    msg += `شکریہ!`;

    const encoded = encodeURIComponent(msg);
    Linking.openURL(`https://wa.me/${activeClient.clientPhone.replace(/[\s\-()]/g, '')}?text=${encoded}`);
  };

  // Mark single slip payment as paid
  const handleMarkItemPaid = async (item: UnifiedLedgerItem) => {
    const targetId = item.isLatest ? activeClient.id : item.id;
    onPaymentChange?.(targetId, 'paid');

    if (item.isLatest) {
      setActiveClient((prev) => ({
        ...prev,
        paymentStatus: 'paid',
        advanceAmount: prev.totalAmount,
      }));
    }

    try {
      if (
        targetId &&
        !targetId.startsWith('meas-') &&
        !targetId.startsWith('current-') &&
        !targetId.startsWith('hist-')
      ) {
        await measurementsApi.updatePayment(targetId, 'paid');
      }
    } catch (err: any) {
      console.log('Error updating payment in backend:', err?.message || err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, Spacing.three),
            paddingBottom: insets.bottom + Spacing.six,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          {/* 1. Top Navigation Bar with Back Button & Shop Seal */}
          <View style={styles.navBar}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedBtn]}>
              <Ionicons name="arrow-back" size={18} color="#1E3A8A" />
              <View style={styles.backBtnTextCol}>
                <Text style={styles.backBtnEn}>Dashboard</Text>
                <Text style={styles.backBtnUr}>ڈیش بورڈ واپس</Text>
              </View>
            </Pressable>

            {/* Title */}
            <View style={styles.navTitleCol}>
              <Text style={[styles.navTitleEn, { color: theme.text }]}>Customer Ledger</Text>
              <Text style={styles.navTitleUr}>گاہک کھاتہ بک</Text>
            </View>

            {/* Shop Brand Icon Seal */}
            <View style={styles.shopLogoSquircle}>
              <Ionicons name="cut-outline" size={18} color="#FFFFFF" />
            </View>
          </View>

          {/* 2. Client Profile & Financial Overview Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.profileTopRow}>
              <View style={styles.profileIdentityCol}>
                <View style={styles.serialNameRow}>
                  {/* Serial Number Pill */}
                  <View style={styles.serialPill}>
                    <Text style={styles.serialPillText}>{activeClient.serialNumber}</Text>
                  </View>
                  <Text style={[styles.clientName, { color: theme.text }]}>
                    {activeClient.clientName}
                  </Text>
                </View>

                {/* Mobile Number with Direct Call Action */}
                <Pressable onPress={handleCall} style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={13} color="#15803D" />
                  <Text style={styles.phoneText}>{activeClient.clientPhone}</Text>
                  <Text style={styles.callBadge}>کال کریں</Text>
                </Pressable>
              </View>

              {/* Client Switcher Trigger */}
              {allClients.length > 1 && (
                <Pressable
                  onPress={() => setShowClientPicker((prev) => !prev)}
                  style={styles.switchClientBtn}>
                  <Ionicons name="people-outline" size={15} color="#1E3A8A" />
                  <View style={styles.switchClientTextCol}>
                    <Text style={styles.switchClientEn}>
                      {showClientPicker ? 'Hide List' : 'Switch Client'}
                    </Text>
                    <Text style={styles.switchClientUr}>
                      {showClientPicker ? 'بند کریں' : 'گاہک بدلیں'}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Client Picker Dropdown Drawer if opened */}
            {showClientPicker && (
              <View style={[styles.pickerBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <BaseInput
                  label="Search Clients"
                  urduLabel="گاہک تلاش کریں"
                  placeholder="Type name, phone or serial..."
                  value={clientSearch}
                  onChangeText={setClientSearch}
                  leftIcon="search-outline"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientPickerScroll}>
                  {filteredClients.map((c) => {
                    const isSelected = c.id === activeClient.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => handleSwitchClient(c)}
                        style={[
                          styles.clientPickChip,
                          {
                            backgroundColor: isSelected ? '#1E3A8A' : theme.card,
                            borderColor: isSelected ? '#1E3A8A' : theme.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.chipSerial,
                            { color: isSelected ? '#FBBF24' : '#64748B' },
                          ]}>
                          {c.serialNumber}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.chipName,
                            { color: isSelected ? '#FFFFFF' : theme.text },
                          ]}>
                          {c.clientName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Financial Overview Metrics (4 Boxes) */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCol, { backgroundColor: theme.backgroundElement }]}>
                <Text style={styles.metricLabelEn}>Total Suits</Text>
                <Text style={styles.metricLabelUr}>کل تیار سوٹ</Text>
                <Text style={[styles.metricVal, { color: '#0F172A' }]}>{summaryStats.totalSuits}</Text>
              </View>

              <View style={[styles.metricCol, { backgroundColor: theme.backgroundElement }]}>
                <Text style={styles.metricLabelEn}>Total Billed</Text>
                <Text style={styles.metricLabelUr}>کل بل رقم</Text>
                <Text style={[styles.metricVal, { color: '#1E3A8A' }]}>Rs. {summaryStats.totalBilled}</Text>
              </View>

              <View style={[styles.metricCol, { backgroundColor: theme.backgroundElement }]}>
                <Text style={styles.metricLabelEn}>Total Paid</Text>
                <Text style={styles.metricLabelUr}>کل وصول رقم</Text>
                <Text style={[styles.metricVal, { color: '#15803D' }]}>Rs. {summaryStats.totalPaid}</Text>
              </View>

              <View
                style={[
                  styles.metricCol,
                  {
                    backgroundColor: summaryStats.totalBalance > 0 ? '#FEF2F2' : '#F0FDF4',
                    borderColor: summaryStats.totalBalance > 0 ? '#FECACA' : '#BBF7D0',
                    borderWidth: 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.metricLabelEn,
                    { color: summaryStats.totalBalance > 0 ? '#B91C1C' : '#15803D' },
                  ]}>
                  Balance Due
                </Text>
                <Text
                  style={[
                    styles.metricLabelUr,
                    { color: summaryStats.totalBalance > 0 ? '#B91C1C' : '#15803D' },
                  ]}>
                  بقیہ واجب الادا
                </Text>
                <Text
                  style={[
                    styles.metricVal,
                    { color: summaryStats.totalBalance > 0 ? '#DC2626' : '#15803D' },
                  ]}>
                  {summaryStats.totalBalance > 0 ? `Rs. ${summaryStats.totalBalance}` : 'Clear (بیباق)'}
                </Text>
              </View>
            </View>

            {/* Action Buttons Row: Add New Suit Order & WhatsApp Statement */}
            <View style={styles.profileActionButtonsRow}>
              {onAddNewOrder && (
                <Pressable
                  onPress={() => onAddNewOrder(activeClient)}
                  style={styles.newSuitOrderBtn}>
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <View style={styles.fullStatementTextCol}>
                    <Text style={styles.newSuitOrderBtnEn}>+ New Suit</Text>
                    <Text style={styles.newSuitOrderBtnUr}>نیا سوٹ آرڈر</Text>
                  </View>
                </Pressable>
              )}

              {/* Quick Full WhatsApp Statement Trigger: English on top, Urdu below */}
              <Pressable
                onPress={handleWhatsAppFullStatement}
                style={[styles.fullStatementBtn, onAddNewOrder && { flex: 1, marginTop: 0 }]}>
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <View style={styles.fullStatementTextCol}>
                  <Text style={styles.fullStatementBtnEn}>
                    {onAddNewOrder ? 'WhatsApp Ledger' : 'Send Full Ledger on WhatsApp'}
                  </Text>
                  <Text style={styles.fullStatementBtnUr}>
                    {onAddNewOrder ? 'کھاتہ واٹس ایپ کریں' : 'مکمل کھاتہ واٹس ایپ پر بھیجیں'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* 3. Search Bar for Ledger: Strictly using BaseInput */}
          <View style={styles.searchSection}>
            <BaseInput
              label="Search Client History & Slips"
              urduLabel="کھاتہ ریکارڈ تلاش کریں"
              placeholder="Search by slip #, garment type, notes, date, amount..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon="search-outline"
              rightIcon={
                searchQuery.length > 0 ? (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </Pressable>
                ) : undefined
              }
              helperText="Instant filter by slip #, fabric notes, or date"
            />
          </View>

          {/* 4. Filter Tabs: Garment Category & Payment Status */}
          <View style={styles.filtersWrapper}>
            {/* Garment Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {[
                { id: 'all', en: 'All Garments', ur: 'تمام لباس' },
                { id: 'shalwar_kameez', en: 'Shalwar Kameez', ur: 'شلوار قمیض' },
                { id: 'kurta_pajama', en: 'Kurta Pajama', ur: 'کرتہ پاجامہ' },
                { id: 'waistcoat', en: 'Waistcoat', ur: 'واسکٹ' },
              ].map((g) => {
                const isSelected = selectedGarment === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => setSelectedGarment(g.id as GarmentFilter)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? '#1E3A8A' : theme.card,
                        borderColor: isSelected ? '#1E3A8A' : theme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterTextEn,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}>
                      {g.en}
                    </Text>
                    <Text
                      style={[
                        styles.filterTextUr,
                        { color: isSelected ? '#FFFFFF' : '#000000' },
                      ]}>
                      {g.ur}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Payment Status Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {[
                { id: 'all', en: 'All Payments', ur: 'تمام ادائیگی' },
                { id: 'paid', en: 'Fully Paid', ur: 'مکمل ادا' },
                { id: 'partial', en: 'Advance Paid', ur: 'پیشگی ادا' },
                { id: 'unpaid', en: 'Balance Due', ur: 'واجب الادا' },
              ].map((p) => {
                const isSelected = selectedPayment === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedPayment(p.id as PaymentFilter)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? '#0F172A' : theme.card,
                        borderColor: isSelected ? '#0F172A' : theme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.filterTextEn,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}>
                      {p.en}
                    </Text>
                    <Text
                      style={[
                        styles.filterTextUr,
                        { color: isSelected ? '#FFFFFF' : '#000000' },
                      ]}>
                      {p.ur}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 5. Records Count Row */}
          <View style={styles.listHeaderRow}>
            <View style={styles.listHeaderCol}>
              <Text style={[styles.listTitleEn, { color: theme.text }]}>
                Ledger Entries ({filteredLedger.length})
              </Text>
              <Text style={styles.listTitleUr}>سابقہ اور موجودہ آرڈر کھاتہ</Text>
            </View>

            {(searchQuery.length > 0 || selectedGarment !== 'all' || selectedPayment !== 'all') && (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedGarment('all');
                  setSelectedPayment('all');
                }}
                style={styles.clearFilterPill}>
                <Ionicons name="refresh-outline" size={13} color="#DC2626" />
                <Text style={styles.clearFilterText}>Reset Filters • صاف کریں</Text>
              </Pressable>
            )}
          </View>

          {/* 6. Chronological Ledger Cards (Latest Always at the Top!) */}
          {filteredLedger.length > 0 ? (
            filteredLedger.map((item, index) => {
              const isWaistcoat = item.garmentType === 'waistcoat';
              const garmentTitle =
                item.garmentType === 'waistcoat'
                  ? { en: 'Waistcoat', ur: 'واسکٹ' }
                  : item.garmentType === 'kurta_pajama'
                  ? { en: 'Kurta Pajama', ur: 'کرتہ پاجامہ' }
                  : { en: 'Shalwar Kameez', ur: 'شلوار قمیض' };

              return (
                <View
                  key={item.id}
                  style={[
                    styles.ledgerCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    item.isLatest && styles.latestLedgerCard,
                  ]}>
                  {/* Top Bar with LATEST ORDER Badge or Index */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardHeaderLeft}>
                      {item.isLatest ? (
                        <View style={styles.latestBadge}>
                          <Ionicons name="star" size={12} color="#FFFFFF" />
                          <Text style={styles.latestBadgeText}>LATEST ORDER • موجودہ آرڈر</Text>
                        </View>
                      ) : (
                        <View style={styles.historyIndexBadge}>
                          <Text style={styles.historyIndexText}>Order #{filteredLedger.length - index}</Text>
                        </View>
                      )}

                      <Text style={[styles.receiptText, { color: theme.text }]}>
                        Slip #{item.receiptNumber}
                      </Text>
                    </View>

                    {/* Date Tag */}
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={13} color="#475569" />
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                  </View>

                  {/* Garment Tag & Payment Status */}
                  <View style={styles.garmentPayRow}>
                    <View style={[styles.garmentPill, { backgroundColor: theme.backgroundElement }]}>
                      <Ionicons name="shirt-outline" size={13} color="#1E3A8A" />
                      <Text style={[styles.garmentEn, { color: theme.text }]}>{garmentTitle.en}</Text>
                      <Text style={styles.garmentUr}>{garmentTitle.ur}</Text>
                    </View>

                    {/* Payment Badge */}
                    <View
                      style={[
                        styles.paymentBadge,
                        {
                          backgroundColor:
                            item.paymentStatus === 'paid'
                              ? '#ECFDF5'
                              : item.paymentStatus === 'partial'
                              ? '#FFFBEB'
                              : '#FEF2F2',
                          borderColor:
                            item.paymentStatus === 'paid'
                              ? '#A7F3D0'
                              : item.paymentStatus === 'partial'
                              ? '#FDE68A'
                              : '#FECACA',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.paymentBadgeText,
                          {
                            color:
                              item.paymentStatus === 'paid'
                                ? '#065F46'
                                : item.paymentStatus === 'partial'
                                ? '#B45309'
                                : '#DC2626',
                          },
                        ]}>
                        {item.paymentStatus === 'paid'
                          ? 'PAID • رقم وصول'
                          : item.paymentStatus === 'partial'
                          ? `DUE Rs. ${item.balanceAmount} • پیشگی ادا`
                          : `UNPAID Rs. ${item.totalAmount} • غیر ادا`}
                      </Text>
                    </View>
                  </View>

                  {/* Financial Breakdown Grid */}
                  <View style={[styles.financialGrid, { backgroundColor: theme.backgroundElement }]}>
                    <View style={styles.financialCol}>
                      <Text style={styles.financialLabelEn}>Total Bill</Text>
                      <Text style={styles.financialLabelUr}>کل رقم</Text>
                      <Text style={[styles.financialVal, { color: theme.text }]}>Rs. {item.totalAmount}</Text>
                    </View>

                    <View style={styles.financialDivider} />

                    <View style={styles.financialCol}>
                      <Text style={styles.financialLabelEn}>Paid Amount</Text>
                      <Text style={styles.financialLabelUr}>ادا شدہ</Text>
                      <Text style={[styles.financialVal, { color: '#15803D' }]}>Rs. {item.paidAmount}</Text>
                    </View>

                    <View style={styles.financialDivider} />

                    <View style={styles.financialCol}>
                      <Text style={styles.financialLabelEn}>Remaining</Text>
                      <Text style={styles.financialLabelUr}>بقیہ واجب</Text>
                      <Text
                        style={[
                          styles.financialVal,
                          { color: item.balanceAmount > 0 ? '#DC2626' : '#15803D' },
                        ]}>
                        {item.balanceAmount > 0 ? `Rs. ${item.balanceAmount}` : 'Clear'}
                      </Text>
                    </View>
                  </View>

                  {/* Categorized Measurements Box: Divided into Qameez & Shalwar */}
                  <View style={[styles.measurementsBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    {/* Qameez / Kurta / Waistcoat Measurements Block */}
                    <View style={styles.subGarmentBlock}>
                      <View style={styles.subGarmentHeader}>
                        <View style={styles.subGarmentBadge}>
                          <Ionicons name="shirt-outline" size={11} color="#1E3A8A" />
                          <Text style={styles.subGarmentEn}>
                            {item.garmentType === 'kurta_pajama'
                              ? 'Kurta'
                              : isWaistcoat
                              ? 'Waistcoat'
                              : 'Qameez'}
                          </Text>
                          <Text style={styles.subGarmentUr}>
                            {item.garmentType === 'kurta_pajama'
                              ? 'کرتہ سائز'
                              : isWaistcoat
                              ? 'واسکٹ سائز'
                              : 'قمیض سائز'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.measChipsRow}>
                        <View style={styles.measChip}>
                          <Text style={styles.measLabelEn}>Length</Text>
                          <Text style={styles.measLabelUr}>لمبائی</Text>
                          <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.length || '-'}"</Text>
                        </View>
                        <View style={styles.measDivider} />
                        <View style={styles.measChip}>
                          <Text style={styles.measLabelEn}>Tera</Text>
                          <Text style={styles.measLabelUr}>تیرا</Text>
                          <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.shoulder || '-'}"</Text>
                        </View>
                        <View style={styles.measDivider} />
                        <View style={styles.measChip}>
                          <Text style={styles.measLabelEn}>Chest</Text>
                          <Text style={styles.measLabelUr}>چھاتی</Text>
                          <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.chest || '-'}"</Text>
                        </View>

                        {!isWaistcoat ? (
                          <>
                            <View style={styles.measDivider} />
                            <View style={styles.measChip}>
                              <Text style={styles.measLabelEn}>Sleeves</Text>
                              <Text style={styles.measLabelUr}>بازو</Text>
                              <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.sleeves || '-'}"</Text>
                            </View>
                            {Boolean(item.kameez.collar && item.kameez.collar !== '0') && (
                              <>
                                <View style={styles.measDivider} />
                                <View style={styles.measChip}>
                                  <Text style={styles.measLabelEn}>Collar</Text>
                                  <Text style={styles.measLabelUr}>گلا</Text>
                                  <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.collar}"</Text>
                                </View>
                              </>
                            )}
                            {Boolean(item.kameez.daman && item.kameez.daman !== '0') && (
                              <>
                                <View style={styles.measDivider} />
                                <View style={styles.measChip}>
                                  <Text style={styles.measLabelEn}>Daman</Text>
                                  <Text style={styles.measLabelUr}>دامن</Text>
                                  <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.daman}"</Text>
                                </View>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {Boolean(item.kameez.waist && item.kameez.waist !== '0') && (
                              <>
                                <View style={styles.measDivider} />
                                <View style={styles.measChip}>
                                  <Text style={styles.measLabelEn}>Waist</Text>
                                  <Text style={styles.measLabelUr}>کمر</Text>
                                  <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.waist}"</Text>
                                </View>
                              </>
                            )}
                            {Boolean(item.kameez.collar && item.kameez.collar !== '0') && (
                              <>
                                <View style={styles.measDivider} />
                                <View style={styles.measChip}>
                                  <Text style={styles.measLabelEn}>Collar</Text>
                                  <Text style={styles.measLabelUr}>گلا</Text>
                                  <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.collar}"</Text>
                                </View>
                              </>
                            )}
                            {Boolean(item.kameez.daman && item.kameez.daman !== '0') && (
                              <>
                                <View style={styles.measDivider} />
                                <View style={styles.measChip}>
                                  <Text style={styles.measLabelEn}>Daman</Text>
                                  <Text style={styles.measLabelUr}>دامن</Text>
                                  <Text style={[styles.measVal, { color: theme.text }]}>{item.kameez.daman}"</Text>
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
                              {item.garmentType === 'kurta_pajama' ? 'Pajama' : 'Shalwar'}
                            </Text>
                            <Text style={styles.subGarmentUr}>
                              {item.garmentType === 'kurta_pajama' ? 'پاجامہ سائز' : 'شلوار سائز'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.measChipsRow}>
                          <View style={styles.measChip}>
                            <Text style={styles.measLabelEn}>Length</Text>
                            <Text style={styles.measLabelUr}>لمبائی</Text>
                            <Text style={[styles.measVal, { color: theme.text }]}>{item.shalwar.length || '-'}"</Text>
                          </View>
                          <View style={styles.measDivider} />
                          <View style={styles.measChip}>
                            <Text style={styles.measLabelEn}>Paoncha</Text>
                            <Text style={styles.measLabelUr}>پانچہ</Text>
                            <Text style={[styles.measVal, { color: theme.text }]}>{item.shalwar.paoncha || '-'}"</Text>
                          </View>
                          {Boolean(item.shalwar.asan && item.shalwar.asan !== '0') && (
                            <>
                              <View style={styles.measDivider} />
                              <View style={styles.measChip}>
                                <Text style={styles.measLabelEn}>Asan</Text>
                                <Text style={styles.measLabelUr}>آسن</Text>
                                <Text style={[styles.measVal, { color: theme.text }]}>{item.shalwar.asan}"</Text>
                              </View>
                            </>
                          )}
                          {Boolean(item.shalwar.waist && item.shalwar.waist !== '0') && (
                            <>
                              <View style={styles.measDivider} />
                              <View style={styles.measChip}>
                                <Text style={styles.measLabelEn}>Ghera / Waist</Text>
                                <Text style={styles.measLabelUr}>گھیرا</Text>
                                <Text style={[styles.measVal, { color: theme.text }]}>{item.shalwar.waist}"</Text>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Style notes if present */}
                  {item.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>✂️ {item.notes}</Text>
                    </View>
                  )}

                  {/* Card Bottom Actions: Edit, WhatsApp Slip & Mark as Paid */}
                  <View style={styles.cardActionsRow}>
                    {onEditOrder && (
                      <Pressable
                        onPress={() => handleEditOrder(item)}
                        style={styles.cardEditBtn}>
                        <Ionicons name="create-outline" size={14} color="#1E3A8A" />
                        <View style={styles.cardBtnTextCol}>
                          <Text style={styles.cardEditEn}>Edit</Text>
                          <Text style={styles.cardEditUr}>ترمیم</Text>
                        </View>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => handleWhatsAppSingleSlip(item)}
                      style={styles.cardSlipBtn}>
                      <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                      <View style={styles.cardBtnTextCol}>
                        <Text style={styles.cardSlipEn}>Send Slip</Text>
                        <Text style={styles.cardSlipUr}>پرچی بھیجیں</Text>
                      </View>
                    </Pressable>

                    {item.paymentStatus !== 'paid' && (
                      <Pressable
                        onPress={() => handleMarkItemPaid(item)}
                        style={styles.cardMarkPaidBtn}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <View style={styles.cardBtnTextCol}>
                          <Text style={styles.cardMarkPaidEn}>Mark Paid</Text>
                          <Text style={styles.cardMarkPaidUr}>رقم وصول</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            /* Empty State when Search or Filter has no results */
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={36} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Ledger Records Found</Text>
              <Text style={styles.emptyTitleUr}>کوئی ریکارڈ نہیں ملا</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                {searchQuery
                  ? `No entries matched "${searchQuery}". Try searching by another slip # or garment.`
                  : 'No entries found under this category.'}
              </Text>
              <BaseButton
                title="Reset Filters • صاف کریں"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedGarment('all');
                  setSelectedPayment('all');
                }}
                variant="outline"
                size="small"
                style={styles.emptyResetBtn}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingHorizontal: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  pressedBtn: {
    opacity: 0.8,
  },
  backBtnTextCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  backBtnEn: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  backBtnUr: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  navTitleCol: {
    alignItems: 'center',
  },
  navTitleEn: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navTitleUr: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  shopLogoSquircle: {
    width: 38,
    height: 38,
    borderRadius: 11,
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
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
    flexWrap: 'wrap',
    gap: 8,
  },
  profileIdentityCol: {
    flex: 1,
  },
  serialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serialPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  serialPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  callBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  switchClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  switchClientTextCol: {
    alignItems: 'flex-start',
  },
  switchClientEn: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E3A8A',
    lineHeight: 12,
  },
  switchClientUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 12,
  },
  pickerBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  clientPickerScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  clientPickChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
  },
  chipSerial: {
    fontSize: 10,
    fontWeight: '800',
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.three,
  },
  metricCol: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  metricLabelEn: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  metricLabelUr: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  metricVal: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  profileActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  newSuitOrderBtn: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    gap: 6,
  },
  newSuitOrderBtnEn: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  newSuitOrderBtnUr: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fullStatementBtn: {
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  fullStatementTextCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  fullStatementBtnEn: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  fullStatementBtnUr: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  searchSection: {
    width: '100%',
    marginBottom: Spacing.two,
  },
  filtersWrapper: {
    gap: 6,
    marginBottom: Spacing.three,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTextEn: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  filterTextUr: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingHorizontal: 2,
  },
  listHeaderCol: {
    flex: 1,
  },
  listTitleEn: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  listTitleUr: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  clearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  ledgerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three + 2,
    marginBottom: Spacing.three,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      } as any,
    }),
  },
  latestLedgerCard: {
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  latestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    gap: 4,
  },
  latestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  historyIndexBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyIndexText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  receiptText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  garmentPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
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
  paymentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  paymentBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  financialGrid: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabelEn: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  financialLabelUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  financialVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  financialDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#CBD5E1',
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
  measChipsRow: {
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
  notesBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 6,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 11,
    color: '#78350F',
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  cardEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  cardEditEn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
    lineHeight: 12,
  },
  cardEditUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 12,
  },
  cardSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  cardBtnTextCol: {
    alignItems: 'flex-start',
    gap: 1,
  },
  cardSlipEn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    lineHeight: 12,
  },
  cardSlipUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#15803D',
    lineHeight: 12,
  },
  cardMarkPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  cardMarkPaidEn: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  cardMarkPaidUr: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  emptyTitleUr: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 1,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.three,
    maxWidth: 280,
  },
  emptyResetBtn: {
    alignSelf: 'center',
  },
});
