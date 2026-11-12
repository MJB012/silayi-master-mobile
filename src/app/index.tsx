import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { authApi } from '@/api/auth-api';
import { clearAuthSession, getAuthToken, getCachedUser } from '@/api/client';
import { AuthScreen } from '@/components/auth-screen';
import { DashboardScreen } from '@/components/dashboard/dashboard-screen';
import { ClientLedgerScreen } from '@/components/ledger/client-ledger-screen';
import { ClientMeasurement, PaymentStatus } from '@/types/measurement';

export default function HomeScreen() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'ledger'>('dashboard');
  const [measurements, setMeasurements] = useState<ClientMeasurement[]>([]);
  const [selectedLedgerClient, setSelectedLedgerClient] = useState<ClientMeasurement | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    client: ClientMeasurement;
    isNewSuit: boolean;
  } | null>(null);

  const [shopProfile, setShopProfile] = useState({
    shopName: 'Silayi Master Tailors',
    tailorName: 'Master Tailor',
  });

  // Verify existing token & session on app launch
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const cachedUser = await getCachedUser();
          if (cachedUser) {
            setShopProfile({
              shopName: cachedUser.shop?.name || 'Silayi Master Tailors',
              tailorName: cachedUser.full_name || 'Master Tailor',
            });
            setIsAuthenticated(true);
          }

          // Verify with server profile in background
          authApi.getProfile().then((user) => {
            if (user) {
              setShopProfile({
                shopName: user.shop?.name || 'Silayi Master Tailors',
                tailorName: user.full_name || 'Master Tailor',
              });
              setIsAuthenticated(true);
            }
          }).catch(() => {
            // Token expired or invalid
            clearAuthSession();
            setIsAuthenticated(false);
          });
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();
  }, []);

  // Payment status update handler (shared between Dashboard & Ledger)
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

    setSelectedLedgerClient((prev) => {
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

  const handleLogout = async () => {
    await clearAuthSession();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setSelectedLedgerClient(null);
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (isAuthenticated) {
    if (currentView === 'ledger' && selectedLedgerClient) {
      return (
        <View style={styles.container}>
          <ClientLedgerScreen
            client={selectedLedgerClient}
            allClients={measurements}
            onBack={() => setCurrentView('dashboard')}
            onSelectClient={(client) => setSelectedLedgerClient(client)}
            onPaymentChange={handlePaymentChange}
            onAddNewOrder={(client) => {
              setPendingAction({ client, isNewSuit: true });
              setCurrentView('dashboard');
            }}
            onEditOrder={(order) => {
              setPendingAction({ client: order, isNewSuit: false });
              setCurrentView('dashboard');
            }}
            shopName={shopProfile.shopName}
            tailorName={shopProfile.tailorName}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <DashboardScreen
          onLogout={handleLogout}
          shopName={shopProfile.shopName}
          tailorName={shopProfile.tailorName}
          measurementsList={measurements}
          onMeasurementsChange={setMeasurements}
          initialEditClient={pendingAction?.client}
          initialIsNewSuit={pendingAction?.isNewSuit}
          onResetInitialEdit={() => setPendingAction(null)}
          onViewLedger={(client) => {
            setSelectedLedgerClient(client);
            setCurrentView('ledger');
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuthScreen
        onLoginSuccess={(_values, user) => {
          if (user) {
            setShopProfile({
              shopName: user.shop?.name || 'Silayi Master Tailors',
              tailorName: user.full_name || 'Master Tailor',
            });
          }
          setIsAuthenticated(true);
        }}
        onSignupSuccess={(values, user) => {
          setShopProfile({
            shopName: user?.shop?.name || values.shopName,
            tailorName: user?.full_name || values.name,
          });
          setIsAuthenticated(true);
        }}
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
