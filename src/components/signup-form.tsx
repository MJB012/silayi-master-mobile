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
  SignupFormValues,
  signupValidationSchema,
} from '@/validation/auth-schema';

export interface SignupFormProps {
  /** Callback triggered on successful signup submission */
  onSubmitSuccess?: (values: SignupFormValues, user?: any) => void;
  /** Trigger to switch to the login tab */
  onSwitchToLogin?: () => void;
}

export function SignupForm({ onSubmitSuccess, onSwitchToLogin }: SignupFormProps) {
  const theme = useTheme();
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const initialValues: SignupFormValues = {
    shopName: '',
    name: '',
    phone: '',
    email: '',
    password: '',
  };

  const handleSignupSubmit = async (
    values: SignupFormValues,
    { setSubmitting }: any
  ) => {
    try {
      setSubmitting(true);
      const res = await authApi.signup({
        shop_name: values.shopName,
        full_name: values.name,
        phone: values.phone,
        email: values.email,
        password: values.password,
      });

      const message = `Shop "${values.shopName}" registered successfully!`;
      setSuccessInfo(message);

      onSubmitSuccess?.(values, res.user);
    } catch (err: any) {
      const errorMsg = err.message || 'Registration failed. Please check your data.';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Registration Failed', errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={initialValues}
        validationSchema={signupValidationSchema}
        onSubmit={handleSignupSubmit}>
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
              {/* Header with Register Tailor Shop and Urdu in 2 lines */}
              <View style={styles.formHeader}>
                <View style={styles.titleColumn}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Register Tailor Shop
                  </Text>
                  <Text style={styles.urduTitle}>
                    دکان کا اندراج
                  </Text>
                </View>
              </View>

              {/* Success Banner */}
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

              {/* 1. BaseInput: Shop Name */}
              <BaseInput
                label="Shop Name"
                urduLabel="دکان کا نام"
                placeholder="Master Al-Karam Tailors"
                value={values.shopName}
                onChangeText={handleChange('shopName')}
                onBlur={handleBlur('shopName')}
                error={errors.shopName}
                touched={touched.shopName}
                required
                leftIcon="business-outline"
                autoCapitalize="words"
                helperText="Brand or shop name for client slips and invoices"
                returnKeyType="next"
              />

              {/* 2. BaseInput: Tailor / Owner Name */}
              <BaseInput
                label="Tailor / Owner Name"
                urduLabel="درزی / مالک کا نام"
                placeholder="Muhammad Tariq"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={errors.name}
                touched={touched.name}
                required
                leftIcon="person-outline"
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* 3. BaseInput: Phone Number */}
              <BaseInput
                label="Phone Number"
                urduLabel="فون نمبر"
                placeholder="0300-1234567"
                value={values.phone}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                error={errors.phone}
                touched={touched.phone}
                required
                leftIcon="call-outline"
                keyboardType="phone-pad"
                helperText="For client order notifications and verification"
                returnKeyType="next"
              />

              {/* 4. BaseInput: Email Address */}
              <BaseInput
                label="Email Address"
                urduLabel="ای میل ایڈریس"
                placeholder="tailor@silayi.com"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                touched={touched.email}
                required
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              {/* 5. BaseInput: Password */}
              <BaseInput
                label="Password"
                urduLabel="پاس ورڈ"
                placeholder="At least 6 characters"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                touched={touched.password}
                required
                isPassword
                leftIcon="lock-closed-outline"
                helperText="Keep your client measurement data secure"
                returnKeyType="done"
                onSubmitEditing={() => handleSubmit()}
              />

              {/* Tailor Feature Highlights */}
              <View style={[styles.featuresCard, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.featureItem}>
                  <Ionicons name="cut-outline" size={16} color={BrandColors.accent} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    Shalwar Kameez, Kurta Pajama & Waistcoat Measurements
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="receipt-outline" size={16} color={BrandColors.accent} />
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                    Customer Stitching History & Billing Ledger
                  </Text>
                </View>
              </View>

              {/* Submit Button with English and Urdu */}
              <BaseButton
                title={isSubmitting ? 'Creating Shop Account...' : 'Create Tailor Account'}
                subtitle={isSubmitting ? undefined : 'اکاؤنٹ بنائیں'}
                onPress={() => handleSubmit()}
                loading={isSubmitting}
                variant="primary"
                size="large"
                icon="checkmark-circle-outline"
                style={styles.submitButton}
              />

              {/* Switch to Login Prompt */}
              {onSwitchToLogin && (
                <View style={styles.switchPromptRow}>
                  <Text style={[styles.switchPromptText, { color: theme.textSecondary }]}>
                    Already have a tailor account?
                  </Text>
                  <Pressable onPress={onSwitchToLogin} style={styles.switchPressable}>
                    <Text style={[styles.switchLinkText, { color: BrandColors.primaryLight }]}>
                      Sign In
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
  featuresCard: {
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Spacing.one,
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
