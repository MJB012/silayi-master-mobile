import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BaseButton } from '@/components/base-button';
import { BaseInput } from '@/components/base-input';
import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ClientMeasurement, GarmentType, PaymentStatus } from '@/types/measurement';
import {
  MeasurementFormValues,
  measurementValidationSchema,
} from '@/validation/measurement-schema';

interface MeasurementBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (measurement: ClientMeasurement) => void;
  editData?: ClientMeasurement | null;
  existingClients?: ClientMeasurement[];
  isNewSuitForClient?: boolean;
}

const getTodayDateString = () => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
};

const getFutureDateString = (daysAhead = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export function MeasurementBottomSheet({
  visible,
  onClose,
  onSave,
  editData,
  existingClients = [],
  isNewSuitForClient = false,
}: MeasurementBottomSheetProps) {
  const theme = useTheme();
  const isEditing = Boolean(editData && !isNewSuitForClient);

  const [selectedGarment, setSelectedGarment] = useState<GarmentType>('shalwar_kameez');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [matchedClient, setMatchedClient] = useState<ClientMeasurement | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    isOpen: boolean;
    field: 'orderDate' | 'deliveryDate';
    currentValue: string;
    onSelect: (val: string) => void;
  }>({
    isOpen: false,
    field: 'deliveryDate',
    currentValue: '',
    onSelect: () => {},
  });

  useEffect(() => {
    if (editData && !isNewSuitForClient) {
      setSelectedGarment(editData.garmentType);
      setSelectedPaymentStatus(editData.paymentStatus || 'unpaid');
    } else if (editData && isNewSuitForClient) {
      setSelectedGarment(editData.garmentType);
      setSelectedPaymentStatus('unpaid');
    } else {
      setSelectedGarment('shalwar_kameez');
      setSelectedPaymentStatus('unpaid');
    }
    setMatchedClient(null);
  }, [editData, isNewSuitForClient, visible]);

  const initialValues: MeasurementFormValues = {
    serialNumber: editData?.serialNumber || '',
    clientName: editData?.clientName || '',
    clientPhone: editData?.clientPhone || '',
    garmentType: editData?.garmentType || 'shalwar_kameez',
    orderDate: isNewSuitForClient
      ? getTodayDateString()
      : (editData?.orderDate || getTodayDateString()),
    deliveryDate: isNewSuitForClient
      ? getFutureDateString(7)
      : (editData?.deliveryDate || getFutureDateString(7)),
    kameezLength: editData?.kameez?.length || '',
    shoulder: editData?.kameez?.shoulder || '',
    sleeves: editData?.kameez?.sleeves || '',
    collar: editData?.kameez?.collar || '',
    chest: editData?.kameez?.chest || '',
    waist: editData?.kameez?.waist || '',
    daman: editData?.kameez?.daman || '',
    shalwarLength: editData?.shalwar?.length || '',
    paoncha: editData?.shalwar?.paoncha || '',
    asan: editData?.shalwar?.asan || '16.0',
    styleNotes: editData?.styleNotes || '',
    // Blank payment fields by default when creating a new record or new suit order!
    totalAmount: isNewSuitForClient ? '' : (editData ? String(editData.totalAmount) : ''),
    advanceAmount: isNewSuitForClient ? '' : (editData ? String(editData.advanceAmount) : ''),
  };

  const handleFormSubmit = (values: MeasurementFormValues) => {
    const total = parseInt(values.totalAmount || '0', 10) || 0;
    const advance = parseInt(values.advanceAmount || '0', 10) || 0;

    let calculatedPaymentStatus: PaymentStatus = selectedPaymentStatus;
    if (total > 0 && advance >= total) calculatedPaymentStatus = 'paid';
    else if (advance === 0) calculatedPaymentStatus = 'unpaid';
    else calculatedPaymentStatus = 'partial';

    const savedMeasurement: ClientMeasurement = {
      id: isEditing ? editData!.id : `meas-${Date.now()}`,
      serialNumber: values.serialNumber || `SR-${Math.floor(100 + Math.random() * 900)}`,
      receiptNumber: isEditing
        ? editData!.receiptNumber
        : `SL-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      garmentType: selectedGarment,
      orderDate: values.orderDate || getTodayDateString(),
      deliveryDate: values.deliveryDate || getFutureDateString(7),
      status: isEditing ? (editData!.status || 'in_progress') : 'in_progress',
      urgent: editData?.urgent || false,
      kameez: {
        length: values.kameezLength,
        shoulder: values.shoulder,
        sleeves: selectedGarment === 'waistcoat' ? '0' : values.sleeves || '0',
        collar: values.collar,
        chest: values.chest,
        waist: values.waist,
        daman: values.daman,
      },
      shalwar: {
        length: selectedGarment === 'waistcoat' ? '0' : values.shalwarLength || '0',
        paoncha: selectedGarment === 'waistcoat' ? '0' : values.paoncha || '0',
        asan: selectedGarment === 'waistcoat' ? '0' : values.asan || '16.0',
      },
      styleNotes: values.styleNotes,
      totalAmount: total,
      advanceAmount: advance,
      paymentStatus: calculatedPaymentStatus,
      lastStitchedDate: isEditing
        ? (editData!.lastStitchedDate || values.orderDate || getTodayDateString())
        : getTodayDateString(),
      history: isEditing ? (editData!.history || []) : [],
    };

    onSave(savedMeasurement);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        {/* Semi-transparent dismiss tap */}
        <Pressable style={styles.backdropDismiss} onPress={onClose} />

        {/* Bottom Sheet Drawer Card */}
        <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
          {/* Top Handle Pill */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  {isEditing ? 'Edit Measurement' : 'New Measurement'}
                </Text>
                <Text style={styles.urduSheetTitle}>
                  {isEditing ? 'پیمائش میں ترمیم' : 'نئی پیمائش درج کریں'}
                </Text>
              </View>
              <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                {isEditing ? 'Update client specs and payment status' : 'Bespoke tailor measurement register'}
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={measurementValidationSchema}
            onSubmit={handleFormSubmit}>
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setValues,
              setFieldValue,
              setTouched,
              isSubmitting,
            }) => {
              // Garment selection handler
              const handleSelectGarment = (type: GarmentType) => {
                setSelectedGarment(type);
                setFieldValue('garmentType', type);
              };

              // Check for returning client match
              const checkMatchingClient = (phone: string, name: string) => {
                if (isEditing) return;
                const cleanP = phone.replace(/[\s\-]/g, '');
                const cleanN = name.trim().toLowerCase();
                if (!cleanP && cleanN.length < 3) {
                  setMatchedClient(null);
                  return;
                }
                const found = existingClients.find((c) => {
                  const matchP = cleanP.length >= 7 && c.clientPhone.replace(/[\s\-]/g, '').includes(cleanP);
                  const matchN = cleanN.length >= 3 && c.clientName.toLowerCase().includes(cleanN);
                  return matchP || matchN;
                });
                setMatchedClient(found || null);
              };

              // Apply existing client's previous measurements to form
              const handleApplyClientData = (c: ClientMeasurement) => {
                setValues({
                  ...values,
                  serialNumber: c.serialNumber || values.serialNumber,
                  clientName: c.clientName,
                  clientPhone: c.clientPhone,
                  garmentType: c.garmentType,
                  kameezLength: c.kameez?.length || '',
                  shoulder: c.kameez?.shoulder || '',
                  sleeves: c.kameez?.sleeves || '',
                  collar: c.kameez?.collar || '',
                  chest: c.kameez?.chest || '',
                  waist: c.kameez?.waist || '',
                  daman: c.kameez?.daman || '',
                  shalwarLength: c.shalwar?.length || '',
                  paoncha: c.shalwar?.paoncha || '',
                  asan: c.shalwar?.asan || '16.0',
                  styleNotes: c.styleNotes || '',
                  orderDate: getTodayDateString(),
                  deliveryDate: getFutureDateString(7),
                  totalAmount: '',
                  advanceAmount: '',
                });
                setSelectedGarment(c.garmentType);
                setSelectedPaymentStatus('unpaid');
                setMatchedClient(null);
              };

              // Quick preset sizes filler (only fills body sizes, does NOT overwrite names, dates or money)
              const handleQuickPreset = () => {
                if (selectedGarment === 'waistcoat') {
                  setValues({
                    ...values,
                    kameezLength: '27.5',
                    shoulder: '18.0',
                    sleeves: '0',
                    collar: '16.0',
                    chest: '22.5',
                    waist: '21.5',
                    daman: '23.0',
                    shalwarLength: '0',
                    paoncha: '0',
                    styleNotes: values.styleNotes || 'واسکٹ، کٹ بین، موبائل اندرونی پاکٹ',
                  });
                } else {
                  setValues({
                    ...values,
                    kameezLength: '42.0',
                    shoulder: '18.5',
                    sleeves: '24.5',
                    collar: '16.0',
                    chest: '23.5',
                    waist: '23.0',
                    daman: '25.0',
                    shalwarLength: '40.0',
                    paoncha: '8.5',
                    asan: '16.5',
                    styleNotes: values.styleNotes || 'بین کالر، کف بازو، سادہ دامن',
                  });
                }
                setTouched({
                  kameezLength: true,
                  shoulder: true,
                  collar: true,
                  chest: true,
                  waist: true,
                  daman: true,
                });
              };

              // Real-time balance calculations
              const parsedTotal = parseInt(values.totalAmount || '0', 10) || 0;
              const parsedAdvance = parseInt(values.advanceAmount || '0', 10) || 0;
              const remainingBalance = Math.max(0, parsedTotal - parsedAdvance);

              return (
                <ScrollView
                  style={styles.sheetScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  {/* 1. Garment Type Selector (Shalwar Kameez / Kurta / Waistcoat) */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitleEn, { color: theme.text }]}>
                      Select Garment Category
                    </Text>
                    <Text style={styles.sectionTitleUr}>لباس کی قسم منتخب کریں</Text>
                  </View>

                  <View style={styles.garmentSelectorRow}>
                    {[
                      { id: 'shalwar_kameez', en: 'Shalwar Kameez', ur: 'شلوار قمیض', icon: 'shirt-outline' },
                      { id: 'kurta_pajama', en: 'Kurta Pajama', ur: 'کرتہ پاجامہ', icon: 'layers-outline' },
                      { id: 'waistcoat', en: 'Waistcoat', ur: 'واسکٹ', icon: 'cut-outline' },
                    ].map((g) => {
                      const isSelected = selectedGarment === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() => handleSelectGarment(g.id as GarmentType)}
                          style={[
                            styles.garmentTypeCard,
                            isSelected && styles.garmentTypeCardActive,
                          ]}>
                          <Ionicons
                            name={g.icon as any}
                            size={18}
                            color={isSelected ? '#1E3A8A' : '#64748B'}
                          />
                          <Text style={[styles.garmentCardEn, isSelected && styles.garmentCardEnActive]}>
                            {g.en}
                          </Text>
                          <Text style={[styles.garmentCardUr, isSelected && styles.garmentCardUrActive]}>
                            {g.ur}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Sample Sizes Helper */}
                  <View style={styles.presetBar}>
                    <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
                      Customer Contact & Schedule
                    </Text>
                    <Pressable onPress={handleQuickPreset} style={styles.presetPill}>
                      <Ionicons name="clipboard-outline" size={12} color="#1E3A8A" />
                      <Text style={styles.presetPillText}>Standard Sizes</Text>
                    </Pressable>
                  </View>

                  {/* Customer & Shop Ledger Details: 2 Balanced Rows of 50/50 Inputs */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <BaseInput
                        label="Serial No."
                        urduLabel="سیریل نمبر"
                        placeholder="105"
                        value={values.serialNumber}
                        onChangeText={handleChange('serialNumber')}
                        onBlur={handleBlur('serialNumber')}
                        error={errors.serialNumber}
                        touched={touched.serialNumber}
                        required
                        leftIcon="barcode-outline"
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <BaseInput
                        label="Phone Number"
                        urduLabel="فون نمبر"
                        placeholder="0300-1234567"
                        value={values.clientPhone}
                        onChangeText={(text) => {
                          setFieldValue('clientPhone', text);
                          checkMatchingClient(text, values.clientName);
                        }}
                        onBlur={handleBlur('clientPhone')}
                        error={errors.clientPhone}
                        touched={touched.clientPhone}
                        required
                        leftIcon="call-outline"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Returning Client Auto-Fill Suggestion Pill */}
                  {matchedClient && !isEditing && (
                    <Pressable
                      onPress={() => handleApplyClientData(matchedClient)}
                      style={styles.foundClientPill}>
                      <Ionicons name="sparkles" size={16} color="#1E3A8A" />
                      <View style={styles.foundClientTextCol}>
                        <Text style={styles.foundClientText}>
                          Returning Client: {matchedClient.clientName} (Serial #{matchedClient.serialNumber})
                        </Text>
                        <Text style={styles.foundClientSubText}>
                          Tap to auto-fill previous body measurements • سابقہ پیمائش لوڈ کریں
                        </Text>
                      </View>
                      <Ionicons name="cloud-download-outline" size={18} color="#1E3A8A" />
                    </Pressable>
                  )}

                  {/* Customer Name */}
                  <View style={styles.fieldFullWidth}>
                    <BaseInput
                      label="Customer Name"
                      urduLabel="گاہک کا نام"
                      placeholder="e.g. Haji Bilal Ahmad"
                      value={values.clientName}
                      onChangeText={(text) => {
                        setFieldValue('clientName', text);
                        checkMatchingClient(values.clientPhone, text);
                      }}
                      onBlur={handleBlur('clientName')}
                      error={errors.clientName}
                      touched={touched.clientName}
                      required
                      leftIcon="person-outline"
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Dates Row: Booking/Order Date & Due/Delivery Date with Interactive Calendar */}
                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <BaseInput
                        label="Order Date"
                        urduLabel="تاریخ آرڈر"
                        placeholder={getTodayDateString()}
                        value={values.orderDate}
                        onChangeText={handleChange('orderDate')}
                        onCalendarPress={() => {
                          setDatePickerConfig({
                            isOpen: true,
                            field: 'orderDate',
                            currentValue: values.orderDate || getTodayDateString(),
                            onSelect: (val) => setFieldValue('orderDate', val),
                          });
                        }}
                        onBlur={handleBlur('orderDate')}
                        inputContainerStyle={styles.dateInputContainer}
                        inputStyle={styles.dateInputText}
                        helperText="تاریخ بکنگ / آرڈر"
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <BaseInput
                        label="Due Date"
                        urduLabel="ڈیلیوری تاریخ"
                        placeholder={getFutureDateString(7)}
                        value={values.deliveryDate}
                        onChangeText={handleChange('deliveryDate')}
                        onCalendarPress={() => {
                          setDatePickerConfig({
                            isOpen: true,
                            field: 'deliveryDate',
                            currentValue: values.deliveryDate || getFutureDateString(7),
                            onSelect: (val) => setFieldValue('deliveryDate', val),
                          });
                        }}
                        onBlur={handleBlur('deliveryDate')}
                        error={errors.deliveryDate}
                        touched={touched.deliveryDate}
                        required
                        inputContainerStyle={styles.dateInputContainer}
                        inputStyle={styles.dateInputText}
                        helperText="کیلنڈر سے ڈیلیوری تاریخ منتخب کریں"
                      />
                    </View>
                  </View>

                  {/* 2. Garment Measurements Grid */}
                  <View style={[styles.sectionHeaderRow, { marginTop: Spacing.two }]}>
                    <Text style={[styles.sectionTitleEn, { color: theme.text }]}>
                      {selectedGarment === 'waistcoat' ? 'Waistcoat Sizes' : 'Kameez / Kurta Sizes'} (Inches)
                    </Text>
                    <Text style={styles.sectionTitleUr}>
                      {selectedGarment === 'waistcoat' ? 'واسکٹ سائز (انچ)' : 'قمیض سائز (انچ)'}
                    </Text>
                  </View>

                  {selectedGarment === 'waistcoat' ? (
                    <>
                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Length"
                            urduLabel="لمبائی"
                            placeholder="27.5"
                            value={values.kameezLength}
                            onChangeText={handleChange('kameezLength')}
                            onBlur={handleBlur('kameezLength')}
                            error={errors.kameezLength}
                            touched={touched.kameezLength}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Tera"
                            urduLabel="تیرا"
                            placeholder="18.0"
                            value={values.shoulder}
                            onChangeText={handleChange('shoulder')}
                            onBlur={handleBlur('shoulder')}
                            error={errors.shoulder}
                            touched={touched.shoulder}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Chest"
                            urduLabel="چھاتی"
                            placeholder="22.5"
                            value={values.chest}
                            onChangeText={handleChange('chest')}
                            onBlur={handleBlur('chest')}
                            error={errors.chest}
                            touched={touched.chest}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Waist"
                            urduLabel="کمر"
                            placeholder="21.5"
                            value={values.waist}
                            onChangeText={handleChange('waist')}
                            onBlur={handleBlur('waist')}
                            error={errors.waist}
                            touched={touched.waist}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Collar"
                            urduLabel="گلا"
                            placeholder="16.0"
                            value={values.collar}
                            onChangeText={handleChange('collar')}
                            onBlur={handleBlur('collar')}
                            error={errors.collar}
                            touched={touched.collar}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Daman"
                            urduLabel="دامن"
                            placeholder="23.0"
                            value={values.daman}
                            onChangeText={handleChange('daman')}
                            onBlur={handleBlur('daman')}
                            error={errors.daman}
                            touched={touched.daman}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Length"
                            urduLabel="لمبائی"
                            placeholder="42.0"
                            value={values.kameezLength}
                            onChangeText={handleChange('kameezLength')}
                            onBlur={handleBlur('kameezLength')}
                            error={errors.kameezLength}
                            touched={touched.kameezLength}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Tera"
                            urduLabel="تیرا"
                            placeholder="18.5"
                            value={values.shoulder}
                            onChangeText={handleChange('shoulder')}
                            onBlur={handleBlur('shoulder')}
                            error={errors.shoulder}
                            touched={touched.shoulder}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Chest"
                            urduLabel="چھاتی"
                            placeholder="23.5"
                            value={values.chest}
                            onChangeText={handleChange('chest')}
                            onBlur={handleBlur('chest')}
                            error={errors.chest}
                            touched={touched.chest}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Waist"
                            urduLabel="کمر"
                            placeholder="23.0"
                            value={values.waist}
                            onChangeText={handleChange('waist')}
                            onBlur={handleBlur('waist')}
                            error={errors.waist}
                            touched={touched.waist}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Sleeves"
                            urduLabel="بازو"
                            placeholder="24.5"
                            value={values.sleeves}
                            onChangeText={handleChange('sleeves')}
                            onBlur={handleBlur('sleeves')}
                            error={errors.sleeves}
                            touched={touched.sleeves}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Collar"
                            urduLabel="گلا"
                            placeholder="16.0"
                            value={values.collar}
                            onChangeText={handleChange('collar')}
                            onBlur={handleBlur('collar')}
                            error={errors.collar}
                            touched={touched.collar}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <BaseInput
                        label="Daman / Ghera"
                        urduLabel="دامن"
                        placeholder="25.0"
                        value={values.daman}
                        onChangeText={handleChange('daman')}
                        onBlur={handleBlur('daman')}
                        error={errors.daman}
                        touched={touched.daman}
                        required
                        keyboardType="decimal-pad"
                      />
                    </>
                  )}

                  {/* 3. Lower Body Measurements: Only shown if NOT waistcoat */}
                  {selectedGarment !== 'waistcoat' && (
                    <>
                      <View style={[styles.sectionHeaderRow, { marginTop: Spacing.two }]}>
                        <Text style={[styles.sectionTitleEn, { color: theme.text }]}>
                          {selectedGarment === 'kurta_pajama' ? 'Pajama Measurements' : 'Shalwar Measurements'} (Inches)
                        </Text>
                        <Text style={styles.sectionTitleUr}>
                          {selectedGarment === 'kurta_pajama' ? 'پاجامہ سائز (انچ)' : 'شلوار سائز (انچ)'}
                        </Text>
                      </View>

                      <View style={styles.rowTwoCols}>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label={selectedGarment === 'kurta_pajama' ? 'Pajama' : 'Shalwar'}
                            urduLabel="شلوار لمبائی"
                            placeholder="40.0"
                            value={values.shalwarLength}
                            onChangeText={handleChange('shalwarLength')}
                            onBlur={handleBlur('shalwarLength')}
                            error={errors.shalwarLength}
                            touched={touched.shalwarLength}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={styles.colHalf}>
                          <BaseInput
                            label="Paoncha"
                            urduLabel="پانچہ"
                            placeholder="8.5"
                            value={values.paoncha}
                            onChangeText={handleChange('paoncha')}
                            onBlur={handleBlur('paoncha')}
                            error={errors.paoncha}
                            touched={touched.paoncha}
                            required
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {/* 4. Style notes & Design instructions */}
                  <BaseInput
                    label="Cutting & Style Notes"
                    urduLabel="سلائی اور کٹنگ ہدایات"
                    placeholder="بین کالر، کف بازو، دائیں پاکٹ، زپ، گول دامن"
                    value={values.styleNotes}
                    onChangeText={handleChange('styleNotes')}
                    onBlur={handleBlur('styleNotes')}
                    leftIcon="create-outline"
                    helperText="کالر، کف، پاکٹ، اور دیگر کٹنگ تفصیل درج کریں"
                  />

                  {/* 5. Payment & Billing Details */}
                  <View style={[styles.sectionHeaderRow, { marginTop: Spacing.two }]}>
                    <Text style={[styles.sectionTitleEn, { color: theme.text }]}>
                      Bill & Payment Status
                    </Text>
                    <Text style={styles.sectionTitleUr}>رقم اور ادائیگی سٹیٹس</Text>
                  </View>

                  <View style={styles.rowTwoCols}>
                    <View style={styles.colHalf}>
                      <BaseInput
                        label="Total Bill"
                        urduLabel="کل رقم"
                        placeholder="0"
                        value={values.totalAmount}
                        onChangeText={(text) => {
                          setFieldValue('totalAmount', text);
                          const tot = parseInt(text || '0', 10) || 0;
                          const adv = parseInt(values.advanceAmount || '0', 10) || 0;
                          if (tot > 0 && adv >= tot) {
                            setSelectedPaymentStatus('paid');
                          } else if (adv > 0) {
                            setSelectedPaymentStatus('partial');
                          } else {
                            setSelectedPaymentStatus('unpaid');
                          }
                        }}
                        onBlur={handleBlur('totalAmount')}
                        keyboardType="numeric"
                        leftIcon="cash-outline"
                      />
                    </View>
                    <View style={styles.colHalf}>
                      <BaseInput
                        label="Advance Paid"
                        urduLabel="پیشگی رقم"
                        placeholder="0"
                        value={values.advanceAmount}
                        onChangeText={(text) => {
                          setFieldValue('advanceAmount', text);
                          const adv = parseInt(text || '0', 10) || 0;
                          const tot = parseInt(values.totalAmount || '0', 10) || 0;
                          if (tot > 0 && adv >= tot) {
                            setSelectedPaymentStatus('paid');
                          } else if (adv > 0) {
                            setSelectedPaymentStatus('partial');
                          } else {
                            setSelectedPaymentStatus('unpaid');
                          }
                        }}
                        onBlur={handleBlur('advanceAmount')}
                        keyboardType="numeric"
                        leftIcon="wallet-outline"
                      />
                    </View>
                  </View>

                  {/* Real-time Dynamic Remaining Balance Display */}
                  <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <View style={styles.balanceCol}>
                      <Text style={[styles.balanceLabelEn, { color: theme.textSecondary }]}>
                        Remaining Balance
                      </Text>
                      <Text style={styles.balanceLabelUr}>بقیہ واجب الادا رقم</Text>
                    </View>
                    <View style={styles.balanceAmountCol}>
                      <Text
                        style={[
                          styles.balanceAmountText,
                          { color: remainingBalance > 0 ? '#DC2626' : '#15803D' },
                        ]}>
                        Rs. {remainingBalance}
                      </Text>
                      <Text
                        style={[
                          styles.balanceStatusSub,
                          { color: remainingBalance > 0 ? '#B91C1C' : '#166534' },
                        ]}>
                        {remainingBalance > 0
                          ? 'بقیہ رقم واجب الادا'
                          : parsedTotal > 0
                          ? 'مکمل ادا شدہ'
                          : 'کوئی رقم نہیں'}
                      </Text>
                    </View>
                  </View>

                  {/* Payment Status Quick Indicator */}
                  <View style={styles.paymentStatusRow}>
                    {[
                      { id: 'paid', en: 'Fully Paid', ur: 'مکمل ادا' },
                      { id: 'partial', en: 'Advance Paid', ur: 'پیشگی ادا' },
                      { id: 'unpaid', en: 'Unpaid / Due', ur: 'غیر ادا شدہ' },
                    ].map((p) => {
                      const isSel = selectedPaymentStatus === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => {
                            setSelectedPaymentStatus(p.id as PaymentStatus);
                            if (p.id === 'paid') {
                              setFieldValue('advanceAmount', values.totalAmount || '0');
                            } else if (p.id === 'unpaid') {
                              setFieldValue('advanceAmount', '0');
                            }
                          }}
                          style={[
                            styles.paymentPill,
                            isSel && styles.paymentPillActive,
                          ]}>
                          <Text style={[styles.paymentPillTextEn, isSel && styles.paymentPillActiveText]}>
                            {p.en}
                          </Text>
                          <Text style={[styles.paymentPillTextUr, isSel && styles.paymentPillActiveText]}>
                            {p.ur}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Submit / Save Button */}
                  <BaseButton
                    title={
                      isNewSuitForClient
                        ? 'Save New Suit Order'
                        : isEditing
                        ? 'Update Measurement'
                        : 'Save New Measurement'
                    }
                    subtitle={
                      isNewSuitForClient
                        ? 'نیا سوٹ آرڈر محفوظ کریں'
                        : isEditing
                        ? 'ترمیم محفوظ کریں'
                        : 'پیمائش محفوظ کریں'
                    }
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
                    variant="primary"
                    size="large"
                    icon="checkmark-done"
                    style={styles.submitBtn}
                  />
                </ScrollView>
              );
            }}
          </Formik>
        </View>
      </KeyboardAvoidingView>

      {/* Visual Calendar Picker Modal: rendered at top-level modal */}
      <CalendarPickerModal
        visible={datePickerConfig.isOpen}
        onClose={() => setDatePickerConfig((prev) => ({ ...prev, isOpen: false }))}
        initialDate={datePickerConfig.currentValue}
        title={datePickerConfig.field === 'deliveryDate' ? 'Select Delivery Due Date' : 'Select Order Date'}
        urduTitle={datePickerConfig.field === 'deliveryDate' ? 'ڈیلیوری تاریخ منتخب کریں' : 'آرڈر تاریخ منتخب کریں'}
        onSelectDate={(formattedDate) => {
          datePickerConfig.onSelect(formattedDate);
          setDatePickerConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  bottomSheet: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: Spacing.four,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  urduSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  sheetScroll: {
    maxHeight: 560,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleEn: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitleUr: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  garmentSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  garmentTypeCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  garmentTypeCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  garmentCardEn: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  garmentCardEnActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  garmentCardUr: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  garmentCardUrActive: {
    color: '#1E3A8A',
  },
  presetBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  colHalf: {
    flex: 1,
  },
  dateInputContainer: {
    paddingHorizontal: 8,
  },
  dateInputText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    paddingHorizontal: 0,
  },
  fieldFullWidth: {
    width: '100%',
    marginBottom: Spacing.two,
  },
  foundClientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    marginBottom: Spacing.two,
    gap: 10,
  },
  foundClientTextCol: {
    flex: 1,
  },
  foundClientText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  foundClientSubText: {
    fontSize: 11,
    color: '#1E40AF',
    marginTop: 2,
    fontWeight: 'bold',
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: Spacing.two,
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabelEn: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceLabelUr: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  balanceAmountCol: {
    alignItems: 'flex-end',
  },
  balanceAmountText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  balanceStatusSub: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: Spacing.three,
  },
  paymentPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  paymentPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  paymentPillTextEn: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentPillTextUr: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentPillActiveText: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});
