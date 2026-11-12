import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dashboardApi } from '@/api/dashboard-api';
import { measurementsApi } from '@/api/measurements-api';
import { BaseButton } from '@/components/base-button';
import { BaseInput } from '@/components/base-input';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MeasurementBottomSheet } from '@/components/dashboard/measurement-bottom-sheet';
import { MeasurementCard } from '@/components/dashboard/measurement-card';
import { MeasurementDetailModal } from '@/components/dashboard/measurement-detail-modal';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ClientMeasurement,
  GarmentType,
  PaymentStatus,
} from '@/types/measurement';

interface DashboardScreenProps {
  onLogout: () => void;
  shopName?: string;
  tailorName?: string;
  onViewLedger?: (client: ClientMeasurement) => void;
  measurementsList?: ClientMeasurement[];
  onMeasurementsChange?: (newMeasurements: ClientMeasurement[]) => void;
  initialEditClient?: ClientMeasurement | null;
  initialIsNewSuit?: boolean;
  onResetInitialEdit?: () => void;
}

type FilterCategory = 'all' | GarmentType;

export function DashboardScreen({
  onLogout,
  shopName = 'Al-Karam Tailors',
  tailorName = 'Master Muhammad Tariq',
  onViewLedger,
  measurementsList,
  onMeasurementsChange,
  initialEditClient,
  initialIsNewSuit = false,
  onResetInitialEdit,
}: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // State
  const [measurements, setInternalMeasurements] = useState<ClientMeasurement[]>(
    measurementsList || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metricsStats, setMetricsStats] = useState<{
    total: number;
    inProgress: number;
    ready: number;
    delivered: number;
  } | null>(null);

  React.useEffect(() => {
    if (measurementsList) {
      setInternalMeasurements(measurementsList);
    }
  }, [measurementsList]);

  const updateMeasurements = (updater: (prev: ClientMeasurement[]) => ClientMeasurement[]) => {
    setInternalMeasurements((prev) => {
      const updated = updater(prev);
      onMeasurementsChange?.(updated);
      return updated;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  // Bottom Sheet state
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientMeasurement | null>(null);
  const [isNewSuitMode, setIsNewSuitMode] = useState(false);

  useEffect(() => {
    if (initialEditClient) {
      setEditingItem(initialEditClient);
      setIsNewSuitMode(Boolean(initialIsNewSuit));
      setIsBottomSheetOpen(true);
      onResetInitialEdit?.();
    }
  }, [initialEditClient, initialIsNewSuit, onResetInitialEdit]);

  // Detail Modal state
  const [selectedDetail, setSelectedDetail] = useState<ClientMeasurement | null>(null);

  // Load live data from backend
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [measurementsData, metricsData] = await Promise.all([
        measurementsApi.getMeasurements(),
        dashboardApi.getMetrics().catch(() => null),
      ]);

      if (measurementsData) {
        setInternalMeasurements(measurementsData);
        onMeasurementsChange?.(measurementsData);
      }

      if (metricsData && metricsData.stats) {
        setMetricsStats(metricsData.stats);
      }
    } catch (err: any) {
      console.log('Error fetching dashboard data:', err?.message || err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onMeasurementsChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics: use server metricsStats or calculated from measurements
  const stats = useMemo(() => {
    if (metricsStats) return metricsStats;
    return {
      total: measurements.length,
      inProgress: measurements.filter((m) => m.status === 'in_progress').length,
      ready: measurements.filter((m) => m.status === 'ready').length,
      delivered: measurements.filter((m) => m.status === 'delivered').length,
    };
  }, [metricsStats, measurements]);

  // Filtered list by Category and Search Query
  const filteredMeasurements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return measurements.filter((m) => {
      // 1. Garment category filter
      if (selectedCategory !== 'all' && m.garmentType !== selectedCategory) {
        return false;
      }

      // 2. Search query filter
      if (q) {
        const matchSerial = (m.serialNumber || '').toLowerCase().includes(q);
        const matchName = m.clientName.toLowerCase().includes(q);
        const matchPhone = m.clientPhone.replace(/[\s\-]/g, '').includes(q.replace(/[\s\-]/g, ''));
        const matchReceipt = m.receiptNumber.toLowerCase().includes(q);
        const matchNotes = (m.styleNotes || '').toLowerCase().includes(q);
        return matchSerial || matchName || matchPhone || matchReceipt || matchNotes;
      }

      return true;
    });
  }, [measurements, searchQuery, selectedCategory]);

  // Open Bottom Sheet to add new record
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsNewSuitMode(false);
    setIsBottomSheetOpen(true);
  };

  // Open Bottom Sheet to edit record
  const handleOpenEdit = (item: ClientMeasurement) => {
    setEditingItem(item);
    setIsNewSuitMode(false);
    setIsBottomSheetOpen(true);
  };

  // Open Bottom Sheet to add a new suit order for returning client
  const handleOpenNewSuitForClient = (client: ClientMeasurement) => {
    setEditingItem(client);
    setIsNewSuitMode(true);
    setIsBottomSheetOpen(true);
  };

  // Save or Update handler from Bottom Sheet: sync with backend
  const handleSaveMeasurement = async (savedItem: ClientMeasurement) => {
    try {
      if (!isNewSuitMode && editingItem && editingItem.id && !editingItem.id.startsWith('meas-')) {
        const updated = await measurementsApi.updateMeasurement(editingItem.id, savedItem);
        updateMeasurements((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        if (selectedDetail && selectedDetail.id === updated.id) {
          setSelectedDetail(updated);
        }
      } else {
        const created = await measurementsApi.createMeasurement(savedItem);
        updateMeasurements((prev) => [created, ...prev]);
      }
      // Re-fetch metrics silently
      dashboardApi.getMetrics().then((m) => {
        if (m?.stats) setMetricsStats(m.stats);
      }).catch(() => {});
    } catch (err: any) {
      console.error('Error saving measurement:', err);
      // Fallback local update
      updateMeasurements((prev) => {
        const existsIndex = prev.findIndex((m) => m.id === savedItem.id);
        if (existsIndex >= 0) {
          const copy = [...prev];
          copy[existsIndex] = savedItem;
          return copy;
        }
        return [savedItem, ...prev];
      });
      if (Platform.OS === 'web') {
        alert(err.message || 'Error saving measurement to server');
      } else {
        Alert.alert('Notice', err.message || 'Saved locally; server sync pending.');
      }
    }

    if (selectedDetail && selectedDetail.id === savedItem.id) {
      setSelectedDetail(savedItem);
    }
  };

  // Payment status update from detail modal: sync with backend
  const handlePaymentChange = async (id: string, newPaymentStatus: PaymentStatus) => {
    // Optimistic local update
    updateMeasurements((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updatedAdvance = newPaymentStatus === 'paid' ? m.totalAmount : m.advanceAmount;
          return {
            ...m,
            paymentStatus: newPaymentStatus,
            advanceAmount: updatedAdvance,
          };
        }
        return m;
      })
    );

    if (selectedDetail && selectedDetail.id === id) {
      setSelectedDetail((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: newPaymentStatus,
              advanceAmount: newPaymentStatus === 'paid' ? prev.totalAmount : prev.advanceAmount,
            }
          : null
      );
    }

    try {
      if (id && !id.startsWith('meas-')) {
        await measurementsApi.updatePayment(id, newPaymentStatus);
        dashboardApi.getMetrics().then((m) => {
          if (m?.stats) setMetricsStats(m.stats);
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to sync payment status with server:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={['#1E3A8A']}
            tintColor="#1E3A8A"
          />
        }
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
          {/* Header Profile, Metrics & Top Bar */}
          <DashboardHeader
            shopName={shopName}
            tailorName={tailorName}
            onLogout={onLogout}
            onAddMeasurement={handleOpenAdd}
            onOpenLedgerBook={() => {
              if (onViewLedger && measurements.length > 0) {
                onViewLedger(measurements[0]);
              }
            }}
            stats={stats}
          />

          {/* Search Bar: Strictly using BaseInput */}
          <View style={styles.searchSection}>
            <BaseInput
              label="Search Clients & Suits"
              urduLabel="گاہک یا پرچی تلاش کریں"
              placeholder="Search by serial #, client name, mobile or receipt #..."
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
              helperText="Instant search by shopkeeper serial #, client name, or phone"
            />
          </View>

          {/* Horizontal Scrollable Category Filter Pills (No wrapping mess) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFiltersScroll}>
            {[
              { id: 'all', en: 'All Suits', ur: 'تمام سوٹ' },
              { id: 'shalwar_kameez', en: 'Shalwar Kameez', ur: 'شلوار قمیض' },
              { id: 'kurta_pajama', en: 'Kurta Pajama', ur: 'کرتہ پاجامہ' },
              { id: 'waistcoat', en: 'Waistcoat', ur: 'واسکٹ' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id as FilterCategory)}
                  style={[
                    styles.categoryFilterButton,
                    {
                      backgroundColor: isSelected ? '#1E3A8A' : theme.card,
                      borderColor: isSelected ? '#1E3A8A' : theme.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.categoryFilterTextEn,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}>
                    {cat.en}
                  </Text>
                  <Text
                    style={[
                      styles.categoryFilterTextUr,
                      { color: isSelected ? '#FFFFFF' : '#000000' },
                    ]}>
                    {cat.ur}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Records List Header */}
          <View style={styles.listHeaderRow}>
            <View style={styles.listCountCol}>
              <Text style={[styles.listHeaderTitle, { color: theme.text }]}>
                Previous Measurements ({filteredMeasurements.length})
              </Text>
              <Text style={styles.urduListTitle}>سابقہ پیمائش اور سوٹ کھاتہ</Text>
            </View>

            <Pressable
              onPress={handleOpenAdd}
              style={styles.addSmallPill}>
              <Ionicons name="add-circle" size={15} color="#1E3A8A" />
              <Text style={styles.addSmallText}>+ New Record</Text>
            </Pressable>
          </View>

          {/* Loading Indicator or Cards List */}
          {isLoading && measurements.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={[styles.emptyTitle, { color: theme.text, marginTop: Spacing.two }]}>
                Loading Measurements...
              </Text>
              <Text style={styles.urduEmptyTitle}>پیمائش لوڈ ہو رہی ہے...</Text>
            </View>
          ) : filteredMeasurements.length > 0 ? (
            filteredMeasurements.map((item) => (
              <MeasurementCard
                key={item.id}
                measurement={item}
                onPress={() => {
                  if (onViewLedger) {
                    onViewLedger(item);
                  } else {
                    setSelectedDetail(item);
                  }
                }}
                onEdit={() => handleOpenEdit(item)}
                onNewSuit={() => handleOpenNewSuitForClient(item)}
              />
            ))
          ) : (
            /* Clean Empty State */
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={36} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Client Records Found
              </Text>
              <Text style={styles.urduEmptyTitle}>کوئی پیمائش نہیں ملی</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {searchQuery
                  ? `No results matched "${searchQuery}". Try another name or phone number.`
                  : 'No measurements found in this category. Add your first record now.'}
              </Text>
              <View style={styles.emptyActionsCol}>
                <BaseButton
                  title="Add Measurement"
                  subtitle="نئی پیمائش شامل کریں"
                  onPress={handleOpenAdd}
                  variant="primary"
                  size="medium"
                  icon="add-circle-outline"
                  style={styles.emptyBtnFull}
                />
                {searchQuery.length > 0 && (
                  <BaseButton
                    title="Clear Search"
                    subtitle="تلاش صاف کریں"
                    onPress={() => setSearchQuery('')}
                    variant="outline"
                    size="medium"
                    icon="refresh-outline"
                    style={styles.emptyBtnFull}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 1. Bottom Sheet for Add & Edit Record */}
      <MeasurementBottomSheet
        visible={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          setIsNewSuitMode(false);
        }}
        onSave={handleSaveMeasurement}
        editData={editingItem}
        existingClients={measurements}
        isNewSuitForClient={isNewSuitMode}
      />

      {/* 2. Detail Modal (Ledger Slip, Payment Status & Stitching History) */}
      <MeasurementDetailModal
        measurement={selectedDetail}
        visible={Boolean(selectedDetail)}
        shopName={shopName}
        onClose={() => setSelectedDetail(null)}
        onEdit={(item) => {
          setSelectedDetail(null);
          handleOpenEdit(item);
        }}
        onPaymentChange={handlePaymentChange}
      />
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
  searchSection: {
    width: '100%',
    marginBottom: Spacing.two,
  },
  categoryFiltersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: Spacing.four,
    paddingBottom: Spacing.three,
  },
  categoryFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFilterTextEn: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryFilterTextUr: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingHorizontal: 2,
  },
  listCountCol: {
    flex: 1,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  urduListTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 1,
  },
  addSmallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  addSmallText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  urduEmptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.three,
    maxWidth: 320,
    lineHeight: 18,
  },
  emptyActionsCol: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 280,
    gap: 10,
    marginTop: 4,
  },
  emptyBtnFull: {
    width: '100%',
  },
});
