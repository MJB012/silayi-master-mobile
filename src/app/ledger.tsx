import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { measurementsApi } from '@/api/measurements-api';
import { ClientLedgerScreen } from '@/components/ledger/client-ledger-screen';
import { ClientMeasurement, PaymentStatus } from '@/types/measurement';

export default function LedgerRoute() {
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    measurementsApi
      .getMeasurements()
      .then((data) => {
        if (data && data.length > 0) {
          setMeasurements(data);
          setSelectedClient(data[0]);
        }
      })
      .catch((err) => {
        console.log('Error loading measurements for ledger:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handlePaymentChange = (id: string, newPaymentStatus: PaymentStatus) => {
    setMeasurements((prev) =>
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

    setSelectedClient((prev) => {
      if (prev && prev.id === id) {
        const updatedAdvance = newPaymentStatus === 'paid' ? prev.totalAmount : prev.advanceAmount;
        return {
          ...prev,
          paymentStatus: newPaymentStatus,
          advanceAmount: updatedAdvance,
        };
      }
      return prev;
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!selectedClient) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ClientLedgerScreen
        client={selectedClient}
        allClients={measurements}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/dashboard');
          }
        }}
        onSelectClient={(c) => setSelectedClient(c)}
        onPaymentChange={handlePaymentChange}
        shopName="Silayi Master Tailors"
        tailorName="Master Tailor"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
