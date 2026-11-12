import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ReturnKeyTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BaseInputProps {
  /** English label text for the input field (rendered on the left side) */
  label: string;
  /** Urdu translation label (rendered on the right side in bold with black color) */
  urduLabel?: string;
  /** Custom style for the Urdu label */
  urduLabelStyle?: StyleProp<TextStyle>;
  /** Current text value */
  value?: string;
  /** Text change callback */
  onChangeText?: (text: string) => void;
  /** Blur event callback */
  onBlur?: (e: NativeSyntheticEvent<any>) => void;
  /** Focus event callback */
  onFocus?: (e: NativeSyntheticEvent<any>) => void;
  /** Placeholder string */
  placeholder?: string;
  /** Placeholder color */
  placeholderTextColor?: string;
  /** Error message (from Yup/Formik) */
  error?: string | false | null;
  /** Touched status (from Formik) */
  touched?: boolean;
  /** Whether the field is required (displays asterisk) */
  required?: boolean;
  /** Optional helper text displayed below input */
  helperText?: string;
  /** Left icon - Ionicons glyph name or custom ReactNode */
  leftIcon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  /** Custom right icon or action */
  rightIcon?: React.ReactNode;
  /** Toggle password masking mode with eye icon */
  isPassword?: boolean;
  /** Manual secureTextEntry flag (overridden if isPassword is set) */
  secureTextEntry?: boolean;
  /** Keyboard type (default, email-address, phone-pad, etc.) */
  keyboardType?: KeyboardTypeOptions;
  /** Auto capitalization */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto correct */
  autoCorrect?: boolean;
  /** Whether input is enabled */
  editable?: boolean;
  /** Multiline support */
  multiline?: boolean;
  /** Number of lines */
  numberOfLines?: number;
  /** Max character length */
  maxLength?: number;
  /** Keyboard return key type */
  returnKeyType?: ReturnKeyTypeOptions;
  /** Submit editing callback */
  onSubmitEditing?: () => void;
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input wrapper / border box style */
  inputContainerStyle?: StyleProp<ViewStyle>;
  /** Inner TextInput style */
  inputStyle?: StyleProp<TextStyle>;
  /** Label style */
  labelStyle?: StyleProp<TextStyle>;
  /** Error text style */
  errorStyle?: StyleProp<TextStyle>;
  /** Helper text style */
  helperStyle?: StyleProp<TextStyle>;
  /** Test identifier */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Press handler for modal/picker inputs (renders pure clickable text area) */
  onPress?: () => void;
  /** Dedicated calendar picker action (keeps text input editable & adds interactive calendar trigger) */
  onCalendarPress?: () => void;
}

/**
 * Default English to Urdu translations for tailor/measurement fields.
 * Used when an explicit urduLabel prop is not provided.
 */
export const DEFAULT_URDU_TRANSLATIONS: Record<string, string> = {
  'shop name': 'دکان کا نام',
  'tailor / owner name': 'درزی / مالک کا نام',
  'tailor name': 'درزی کا نام',
  'owner name': 'مالک کا نام',
  'full name': 'مکمل نام',
  'name': 'نام',
  'customer name': 'گاہک کا نام',
  'client name': 'گاہک کا نام',
  'phone number': 'فون نمبر',
  'phone': 'فون نمبر',
  'phone #': 'فون نمبر',
  'mobile number': 'موبائل نمبر',
  'email address': 'ای میل ایڈریس',
  'email': 'ای میل ایڈریس',
  'password': 'پاس ورڈ',
  'email or phone number': 'ای میل یا فون نمبر',
  'confirm password': 'پاس ورڈ کی تصدیق',
  'serial number': 'سیریل نمبر',
  'serial no': 'سیریل نمبر',
  'serial no.': 'سیریل نمبر',
  'serial #': 'سیریل نمبر',
  'serial': 'سیریل نمبر',
  'delivery date': 'ڈیلیوری تاریخ',
  'due date': 'ڈیلیوری تاریخ',
  'measurement': 'پیمائش',
  'suit': 'سوٹ',
  'length': 'لمبائی',
  'kameez length': 'قمیض لمبائی',
  'shoulder': 'تیرا',
  'tera': 'تیرا',
  'tera / shoulder': 'تیرا',
  'chest': 'چھاتی',
  'waist': 'کمر',
  'collar': 'گلا',
  'sleeves': 'بازو',
  'daman': 'دامن',
  'daman / ghera': 'دامن',
  'shalwar': 'شلوار',
  'shalwar length': 'شلوار لمبائی',
  'paoncha': 'پانچہ',
  'asan': 'آسن',
  'total bill': 'کل رقم',
  'total amount': 'کل رقم',
  'advance': 'پیشگی رقم',
  'advance paid': 'پیشگی رقم',
  'style notes': 'سلائی ہدایات',
  'cutting notes': 'کٹنگ ہدایات',
};

/**
 * Base Input Component for Silayi Master
 * Cross-platform reusable text input with bilingual labels (English on left,
 * bold black Urdu on right), icons, focus states, Formik validation support,
 * and password visibility toggling.
 */
export function BaseInput({
  label,
  urduLabel,
  urduLabelStyle,
  value,
  onChangeText,
  onBlur,
  onFocus,
  placeholder,
  placeholderTextColor,
  error,
  touched,
  required = false,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperStyle,
  testID,
  accessibilityLabel,
  onPress,
  onCalendarPress,
}: BaseInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Resolve Urdu translation: use explicit urduLabel or lookup from dictionary
  const resolvedUrduLabel =
    urduLabel ??
    (label ? DEFAULT_URDU_TRANSLATIONS[label.trim().toLowerCase()] : undefined);

  // Determine whether to display validation error
  const hasError = Boolean(touched && error);

  // Handle focus & blur
  const handleFocus = (e: NativeSyntheticEvent<any>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<any>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Border & background colors based on state
  const getBorderColor = () => {
    if (hasError) return BrandColors.error;
    if (isFocused) return '#0F172A';
    return theme.border;
  };

  const getBackgroundColor = () => {
    if (!editable) return theme.backgroundElement;
    return theme.inputBg;
  };

  const isSecure = isPassword ? !showPassword : (secureTextEntry ?? false);

  // Render left icon
  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    if (typeof leftIcon === 'string') {
      const iconColor = hasError
        ? BrandColors.error
        : isFocused
        ? BrandColors.primaryLight
        : theme.textSecondary;
      const content = (
        <Ionicons
          name={leftIcon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={onCalendarPress ? '#1E3A8A' : iconColor}
        />
      );
      if (onCalendarPress) {
        return (
          <Pressable onPress={onCalendarPress} hitSlop={8} style={styles.leftIconContainer}>
            {content}
          </Pressable>
        );
      }
      return <View style={styles.leftIconContainer}>{content}</View>;
    }

    return <View style={styles.leftIconContainer}>{leftIcon}</View>;
  };

  // Render right icon (either password toggle or custom right icon or calendar trigger)
  const renderRightIcon = () => {
    if (isPassword) {
      return (
        <Pressable
          hitSlop={8}
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.rightIconButton}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>
      );
    }

    if (rightIcon) {
      return <View style={styles.rightIconContainer}>{rightIcon}</View>;
    }

    if (onCalendarPress) {
      return (
        <Pressable
          onPress={onCalendarPress}
          hitSlop={10}
          style={styles.calendarTriggerBtn}
          accessibilityRole="button"
          accessibilityLabel="Open calendar">
          <Ionicons name="calendar" size={16} color="#1E3A8A" />
        </Pressable>
      );
    }

    if (onPress) {
      return (
        <View style={styles.rightIconContainer}>
          <Ionicons name="calendar-outline" size={19} color="#1E3A8A" />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label Row: English on the left, Urdu in bold black on the right */}
      <View style={styles.labelRow}>
        <View style={styles.leftLabelContainer}>
          <Text
            style={[
              styles.label,
              { color: theme.text },
              labelStyle,
            ]}>
            {label}
          </Text>
          {required && <Text style={styles.requiredAsterisk}>*</Text>}
        </View>

        {resolvedUrduLabel ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.urduLabel,
              urduLabelStyle,
            ]}>
            {resolvedUrduLabel}
          </Text>
        ) : null}
      </View>

      {/* Input container with dynamic border, background, and icons */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
          },
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          !editable && styles.inputDisabled,
          inputContainerStyle,
        ]}>
        {renderLeftIcon()}

        {onPress ? (
          <Pressable
            onPress={onPress}
            style={styles.pressableTextArea}>
            <Text
              numberOfLines={1}
              style={[
                styles.textInput,
                { color: value ? theme.text : (placeholderTextColor ?? BrandColors.placeholder) },
                inputStyle,
              ]}>
              {value || placeholder}
            </Text>
          </Pressable>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor ?? BrandColors.placeholder}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            testID={testID}
            accessibilityLabel={accessibilityLabel ?? label}
            style={[
              styles.textInput,
              { color: theme.text },
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
              inputStyle,
            ]}
          />
        )}

        {renderRightIcon()}
      </View>

      {/* Validation Error Message */}
      {hasError ? (
        <View style={styles.messageRow}>
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={BrandColors.error}
            style={styles.messageIcon}
          />
          <Text style={[styles.errorText, errorStyle]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textSecondary }, helperStyle]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.three,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
    width: '100%',
    flexWrap: 'wrap',
    gap: 4,
  },
  leftLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  requiredAsterisk: {
    color: BrandColors.error,
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 3,
  },
  urduLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    marginLeft: Spacing.two,
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 46,
    height: 46,
    maxHeight: 46,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 0.5,
      },
      web: {
        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      } as any,
    }),
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: '#0F172A',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(15, 23, 42, 0.08)',
      } as any,
    }),
  },
  inputError: {
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)',
      } as any,
    }),
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    height: 42,
  },
  leftIconContainer: {
    marginRight: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconButton: {
    marginLeft: Spacing.two,
    padding: Spacing.half,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressableTextArea: {
    flex: 1,
    justifyContent: 'center',
    height: 42,
  },
  calendarTriggerBtn: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 18,
    paddingHorizontal: 2,
  },
  messageIcon: {
    marginRight: 4,
  },
  errorText: {
    color: BrandColors.error,
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  helperText: {
    fontSize: 11.5,
    marginTop: 4,
    paddingHorizontal: 2,
  },
});
