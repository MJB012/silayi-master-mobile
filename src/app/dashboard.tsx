import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DashboardScreen } from '@/components/dashboard/dashboard-screen';

export default function DashboardRoute() {
  return (
    <View style={styles.container}>
      <DashboardScreen
        onLogout={() => {
          router.replace('/');
        }}
        onViewLedger={() => {
          router.push('/ledger');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
