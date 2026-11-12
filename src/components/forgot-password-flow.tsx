import { Ionicons } from '@expo/vector-icons';
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

export interface ForgotPasswordFlowProps {
  /** Return back to the login screen */
  onBackToLogin: () => void;
  /** Triggered when password is reset successfully, passes the email to pre-fill login */
  onResetComplete: (email: string) => void;
}

type ForgotStep = 'email' | 'code' | 'new-password';

export function ForgotPasswordFlow({
  onBackToLogin,
  onResetComplete,
}: ForgotPasswordFlowProps) {
  const theme = useTheme();

  // Current Step state
  const [step, setStep] = useState<ForgotStep>('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // STEP 1: Handle Email Submit
  const handleEmailSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmailError(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validation check
    if (!cleanEmail) {
      setEmailError('Please enter your email address');
      return;
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to request reset verification code
      const response = await authApi.forgotPassword(cleanEmail);

      const codeReceived = response.verification_code || '123456';
      setGeneratedCode(codeReceived);

      const successText = response.message || `Verification code sent to ${cleanEmail}. Please enter the code below.`;
      setSuccessMessage(successText);

      if (Platform.OS === 'web') {
        // Web feedback
      } else {
        Alert.alert('Code Sent', `A verification code (${codeReceived}) has been sent to ${cleanEmail}`);
      }

      // Switch to Step 2: Code
      setStep('code');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Email address not found. This email is not registered in our tailor shop database.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Handle Code Verification Submit
  const handleCodeSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setCodeError(null);

    const cleanCode = code.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanCode) {
      setCodeError('Please enter the 6-digit code');
      return;
    }

    if (cleanCode.length < 4) {
      setCodeError('Code must be at least 4-6 digits');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to verify code
      const response = await authApi.verifyCode(cleanEmail, cleanCode);

      if (response.valid) {
        setSuccessMessage('Code verified successfully! Please enter your new password.');
        setStep('new-password');
      } else {
        setErrorMessage(response.message || 'Invalid verification code. Please check and enter the correct code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code. Please check and enter the correct code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(email.trim().toLowerCase());
      const codeReceived = response.verification_code || generatedCode || '123456';
      setGeneratedCode(codeReceived);
      setSuccessMessage(`A new verification code (${codeReceived}) was resent to ${email.trim()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Handle Reset Password Submit
  const handleResetPasswordSubmit = async () => {
    setErrorMessage(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!password) {
      setPasswordError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();

      // Call backend API to reset password
      await authApi.resetPassword(cleanEmail, cleanCode, password);

      const successNotice = 'Password reset successfully! Please log in with your new password.';
      if (Platform.OS === 'web') {
        alert(successNotice);
      } else {
        Alert.alert('Success', successNotice);
      }

      onResetComplete(cleanEmail);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Step Progress Indicators */}
      <View style={styles.stepIndicatorRow}>
        <View
          style={[
            styles.stepBadge,
            styles.stepBadgeActive,
          ]}>
          <Text style={styles.stepBadgeTextActive}>1</Text>
        </View>
        <View
          style={[
            styles.stepLine,
            (step === 'code' || step === 'new-password') && styles.stepLineActive,
          ]}
        />
        <View
          style={[
            styles.stepBadge,
            (step === 'code' || step === 'new-password')
              ? styles.stepBadgeActive
              : styles.stepBadgeInactive,
          ]}>
          <Text
            style={
              (step === 'code' || step === 'new-password')
                ? styles.stepBadgeTextActive
                : styles.stepBadgeTextInactive
            }>
            2
          </Text>
        </View>
        <View
          style={[
            styles.stepLine,
            step === 'new-password' && styles.stepLineActive,
          ]}
        />
        <View
          style={[
            styles.stepBadge,
            step === 'new-password' ? styles.stepBadgeActive : styles.stepBadgeInactive,
          ]}>
          <Text
            style={
              step === 'new-password'
                ? styles.stepBadgeTextActive
                : styles.stepBadgeTextInactive
            }>
            3
          </Text>
        </View>
      </View>

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={BrandColors.error} style={styles.bannerIcon} />
          <View style={styles.bannerTextCol}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
            <Text style={styles.urduErrorText}>برائے مہربانی درست معلومات درج کریں</Text>
          </View>
        </View>
      )}

      {/* Success Banner */}
      {successMessage && (
        <View style={styles.successBanner}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={BrandColors.success}
            style={styles.bannerIcon}
          />
          <View style={styles.bannerTextCol}>
            <Text style={styles.successBannerText}>{successMessage}</Text>
            <Text style={styles.urduSuccessText}>عمل کامیابی سے مکمل ہوا</Text>
          </View>
        </View>
      )}

      {/* ================= STEP 1: ENTER EMAIL ================= */}
      {step === 'email' && (
        <View style={styles.stepContent}>
          <View style={styles.formHeader}>
            <View style={styles.titleColumn}>
              <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>
              <Text style={styles.urduTitle}>پاس ورڈ بھول گئے؟</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter your registered shop email to receive a password reset verification code
            </Text>
          </View>

          <BaseInput
            label="Shop Email Address"
            urduLabel="دکان کا ای میل ایڈریس"
            placeholder="e.g. master@silayimaster.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (emailError) setEmailError(null);
              if (errorMessage) setErrorMessage(null);
            }}
            error={emailError}
            touched={!!emailError}
            required
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            helperText="We will check if your email is registered in the tailor ledger"
            returnKeyType="done"
            onSubmitEditing={handleEmailSubmit}
          />

          {/* Quick Demo Hint */}
          <View style={styles.demoEmailHint}>
            <Ionicons name="information-circle-outline" size={14} color="#64748B" />
            <Text style={styles.demoEmailHintText}>
              Test with registered: master@silayimaster.com or demo@silayi.com
            </Text>
          </View>

          <BaseButton
            title="Send Verification Code"
            subtitle="تصدیقی کوڈ حاصل کریں"
            onPress={handleEmailSubmit}
            loading={isLoading}
            variant="primary"
            size="large"
            icon="paper-plane-outline"
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* ================= STEP 2: ENTER VERIFICATION CODE ================= */}
      {step === 'code' && (
        <View style={styles.stepContent}>
          <View style={styles.formHeader}>
            <View style={styles.titleColumn}>
              <Text style={[styles.title, { color: theme.text }]}>Verify Code</Text>
              <Text style={styles.urduTitle}>تصدیقی کوڈ درج کریں</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter the 6-digit verification code sent to{' '}
              <Text style={{ fontWeight: '700', color: theme.text }}>{email.trim()}</Text>
            </Text>
          </View>

          <BaseInput
            label="Verification Code"
            urduLabel="تصدیقی کوڈ"
            placeholder="Enter 6-digit code (e.g. 123456)"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              if (codeError) setCodeError(null);
              if (errorMessage) setErrorMessage(null);
            }}
            error={codeError}
            touched={!!codeError}
            required
            leftIcon="key-outline"
            keyboardType="number-pad"
            maxLength={6}
            helperText="Check your email inbox or use test code: 123456"
            returnKeyType="done"
            onSubmitEditing={handleCodeSubmit}
          />

          {/* Options: Resend & Change Email */}
          <View style={styles.codeActionsRow}>
            <Pressable onPress={handleResendCode} style={styles.subActionPressable}>
              <Ionicons name="refresh-outline" size={14} color={BrandColors.primaryLight} />
              <Text style={[styles.subActionText, { color: BrandColors.primaryLight }]}>
                Resend Code • دوبارہ بھیجیں
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setStep('email');
              }}
              style={styles.subActionPressable}>
              <Ionicons name="create-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.subActionText, { color: theme.textSecondary }]}>
                Change Email • ای میل بدلیں
              </Text>
            </Pressable>
          </View>

          <BaseButton
            title="Verify Code"
            subtitle="کوڈ کی تصدیق کریں"
            onPress={handleCodeSubmit}
            loading={isLoading}
            variant="primary"
            size="large"
            icon="checkmark-circle-outline"
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* ================= STEP 3: ENTER NEW PASSWORD ================= */}
      {step === 'new-password' && (
        <View style={styles.stepContent}>
          <View style={styles.formHeader}>
            <View style={styles.titleColumn}>
              <Text style={[styles.title, { color: theme.text }]}>New Password</Text>
              <Text style={styles.urduTitle}>نیا پاس ورڈ درج کریں</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter a secure new password for your tailor shop account
            </Text>
          </View>

          <BaseInput
            label="New Password"
            urduLabel="نیا پاس ورڈ"
            placeholder="Min 6 characters"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError}
            touched={!!passwordError}
            required
            isPassword
            leftIcon="lock-closed-outline"
            returnKeyType="next"
          />

          <BaseInput
            label="Confirm New Password"
            urduLabel="پاس ورڈ کی تصدیق"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (confirmPasswordError) setConfirmPasswordError(null);
            }}
            error={confirmPasswordError}
            touched={!!confirmPasswordError}
            required
            isPassword
            leftIcon="shield-checkmark-outline"
            returnKeyType="done"
            onSubmitEditing={handleResetPasswordSubmit}
          />

          <BaseButton
            title="Update Password"
            subtitle="نیا پاس ورڈ محفوظ کریں"
            onPress={handleResetPasswordSubmit}
            loading={isLoading}
            variant="primary"
            size="large"
            icon="save-outline"
            style={styles.actionBtn}
          />
        </View>
      )}

      {/* Universal Return to Sign In button */}
      <View style={styles.backRow}>
        <Pressable onPress={onBackToLogin} style={styles.backPressable}>
          <Ionicons name="arrow-back" size={15} color={BrandColors.primaryLight} />
          <Text style={[styles.backText, { color: BrandColors.primaryLight }]}>
            Back to Sign In  •  لاگ ان پر واپس جائیں
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#1E3A8A',
  },
  stepBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepBadgeTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepBadgeTextInactive: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#1E3A8A',
  },
  stepContent: {
    width: '100%',
  },
  formHeader: {
    marginBottom: Spacing.three,
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
    fontSize: 12.5,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
    gap: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
    gap: 8,
  },
  bannerIcon: {
    marginTop: 1,
  },
  bannerTextCol: {
    flex: 1,
  },
  errorBannerText: {
    fontSize: 12.5,
    color: '#991B1B',
    fontWeight: '600',
    lineHeight: 17,
  },
  urduErrorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991B1B',
    marginTop: 2,
  },
  successBannerText: {
    fontSize: 12.5,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 17,
  },
  urduSuccessText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
    marginTop: 2,
  },
  demoEmailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: -4,
    marginBottom: Spacing.three,
    gap: 6,
  },
  demoEmailHintText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  codeActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: Spacing.three,
    flexWrap: 'wrap',
    gap: 8,
  },
  subActionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  subActionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  backRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  backPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
