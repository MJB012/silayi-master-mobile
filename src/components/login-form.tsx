import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authApi } from '@/api/auth-api';
import { BaseButton } from '@/components/base-button';
import { BaseInput } from '@/components/base-input';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  LoginFormValues,
  loginValidationSchema,
} from '@/validation/auth-schema';

export interface LoginFormProps {
  /** Callback triggered on successful login submission */
  onSubmitSuccess?: (values: LoginFormValues, user?: any) => void;
  /** Trigger to switch to the signup tab */
  onSwitchToSignup?: () => void;
  /** Trigger to switch to forgot password flow */
  onForgotPassword?: () => void;
  /** Initial email or identifier (e.g. populated after password reset) */
  initialIdentifier?: string;
}

export function LoginForm({
  onSubmitSuccess,
  onSwitchToSignup,
  onForgotPassword,
  initialIdentifier = '',
}: LoginFormProps) {
  const theme = useTheme();
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const initialValues: LoginFormValues = {
    identifier: initialIdentifier,
    password: '',
  };

  const handleLoginSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: any
  ) => {
    try {
      setSubmitting(true);
      const res = await authApi.login(values.identifier, values.password);
      const message = `Welcome back, ${res.user.full_name}!`;
      setSuccessInfo(message);

      onSubmitSuccess?.(values, res.user);
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to log in. Please check your credentials.';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Login Failed', errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={initialValues}
        validationSchema={loginValidationSchema}
        onSubmit={handleLoginSubmit}>
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => {
          return (
            <View style={styles.formContent}>
              {/* Login Title & Urdu Subtitle in 2 distinct lines */}
              <View style={styles.formHeader}>
                <View style={styles.titleColumn}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Tailor Sign In
                  </Text>
                  <Text style={styles.urduTitle}>
                    درزی لاگ ان
                  </Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Enter your credentials to access the shop ledger
                </Text>
              </View>

              {/* Success Banner if successfully simulated */}
              {successInfo && (
                <View style={styles.successBanner}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={BrandColors.success}
                    style={styles.successIcon}
                  />
                  <Text style={styles.successText}>{successInfo}</Text>
                </View>
              )}

              {/* 1. BaseInput: Email or Phone Number */}
              <BaseInput
                label="Email or Phone Number"
                urduLabel="ای میل یا فون نمبر"
                placeholder="0300-1234567 or master@silayi.com"
                value={values.identifier}
                onChangeText={handleChange('identifier')}
                onBlur={handleBlur('identifier')}
                error={errors.identifier}
                touched={touched.identifier}
                required
                leftIcon="person-circle-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                helperText="Enter your registered tailor phone or shop email"
                returnKeyType="next"
              />

              {/* 2. BaseInput: Password */}
              <BaseInput
                label="Password"
                urduLabel="پاس ورڈ"
                placeholder="Enter password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                touched={touched.password}
                required
                isPassword
                leftIcon="lock-closed-outline"
                returnKeyType="done"
                onSubmitEditing={() => handleSubmit()}
              />

              {/* Actions row: Forgot Password */}
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => {
                    if (onForgotPassword) {
                      onForgotPassword();
                    } else {
                      const msg = 'Password reset instructions have been sent to your phone/email.';
                      if (Platform.OS === 'web') {
                        alert(msg);
                      } else {
                        Alert.alert('Reset Password', msg);
                      }
                    }
                  }}>
                  <Text style={[styles.forgotPasswordText, { color: BrandColors.primaryLight }]}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>

              {/* Submit Button with English and Urdu */}
              <BaseButton
                title={isSubmitting ? 'Authenticating...' : 'Sign In'}
                subtitle={isSubmitting ? undefined : 'لاگ ان'}
                onPress={() => handleSubmit()}
                loading={isSubmitting}
                variant="primary"
                size="large"
                icon="log-in-outline"
                style={styles.submitButton}
              />

              {/* Switch to Signup Prompt */}
              {onSwitchToSignup && (
                <View style={styles.switchPromptRow}>
                  <Text style={[styles.switchPromptText, { color: theme.textSecondary }]}>
                    Don't have a shop account yet?
                  </Text>
                  <Pressable onPress={onSwitchToSignup} style={styles.switchPressable}>
                    <Text style={[styles.switchLinkText, { color: BrandColors.primaryLight }]}>
                      Sign Up
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  formContent: {
    width: '100%',
  },
  formHeader: {
    marginBottom: Spacing.four,
  },
  titleColumn: {
    width: '100%',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  urduTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    alignSelf: 'stretch',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  successIcon: {
    marginRight: Spacing.two,
  },
  successText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: -Spacing.one,
    marginBottom: Spacing.three,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: Spacing.two,
  },
  switchPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
    gap: 6,
  },
  switchPromptText: {
    fontSize: 14,
  },
  switchPressable: {
    paddingVertical: 4,
  },
  switchLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
