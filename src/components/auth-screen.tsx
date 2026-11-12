import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthHeader } from '@/components/auth-header';
import { BaseButton } from '@/components/base-button';
import { ForgotPasswordFlow } from '@/components/forgot-password-flow';
import { LoginForm } from '@/components/login-form';
import { SignupForm } from '@/components/signup-form';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LoginFormValues, SignupFormValues } from '@/validation/auth-schema';

type AuthTab = 'login' | 'signup' | 'forgot-password';

export interface AuthScreenProps {
  onLoginSuccess?: (values: LoginFormValues, user?: any) => void;
  onSignupSuccess?: (values: SignupFormValues, user?: any) => void;
}

export function AuthScreen({ onLoginSuccess, onSignupSuccess }: AuthScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [resetUserEmail, setResetUserEmail] = useState('');

  const handleLoginSuccess = (values: LoginFormValues, user?: any) => {
    onLoginSuccess?.(values, user);
  };

  const handleSignupSuccess = (values: SignupFormValues, user?: any) => {
    onSignupSuccess?.(values, user);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardView, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, Spacing.four),
            paddingBottom: Math.max(insets.bottom, Spacing.four),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Header branding */}
          <AuthHeader />

          {/* Card wrapper */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}>
            {activeTab !== 'forgot-password' ? (
              <>
                {/* Segmented Tab Switcher: 2 Lines (English Top, Bold Black Urdu Bottom) */}
                <View style={[styles.tabBar, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                  <Pressable
                    onPress={() => setActiveTab('login')}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'login' }}
                    style={[
                      styles.tabButton,
                      activeTab === 'login' && styles.tabButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.tabEnglishText,
                        activeTab === 'login' && styles.tabEnglishTextActive,
                      ]}>
                      Sign In
                    </Text>
                    <Text style={styles.tabUrduText}>
                      لاگ ان
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setActiveTab('signup')}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'signup' }}
                    style={[
                      styles.tabButton,
                      activeTab === 'signup' && styles.tabButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.tabEnglishText,
                        activeTab === 'signup' && styles.tabEnglishTextActive,
                      ]}>
                      Register Shop
                    </Text>
                    <Text style={styles.tabUrduText}>
                      دکان رجسٹر کریں
                    </Text>
                  </Pressable>
                </View>

                {/* Active Form */}
                {activeTab === 'login' ? (
                  <LoginForm
                    onSubmitSuccess={handleLoginSuccess}
                    onSwitchToSignup={() => setActiveTab('signup')}
                    onForgotPassword={() => setActiveTab('forgot-password')}
                    initialIdentifier={resetUserEmail}
                  />
                ) : (
                  <SignupForm
                    onSubmitSuccess={handleSignupSuccess}
                    onSwitchToLogin={() => setActiveTab('login')}
                  />
                )}
              </>
            ) : (
              <ForgotPasswordFlow
                onBackToLogin={() => setActiveTab('login')}
                onResetComplete={(email) => {
                  setResetUserEmail(email);
                  setActiveTab('login');
                }}
              />
            )}
          </View>

          {/* Subtle Trust Footer */}
          <View style={styles.footerHighlights}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#64748B" />
            <Text style={[styles.highlightText, { color: theme.textSecondary }]}>
              Tailor Measurement Vault • محفوظ درزی کھاتہ
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 520, // Crisp centered presentation across mobile, tablet, and web
    alignItems: 'stretch',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
      } as any,
    }),
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
      } as any,
    }),
  },
  tabEnglishText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  tabEnglishTextActive: {
    fontWeight: '700',
    color: '#0F172A',
  },
  tabUrduText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.2,
  },
  footerHighlights: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
    gap: 6,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
});
