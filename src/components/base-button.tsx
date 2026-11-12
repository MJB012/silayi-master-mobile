import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BaseButtonProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function BaseButton({
  title,
  subtitle,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  subtitleStyle,
  accessibilityLabel,
}: BaseButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  let displayTitle = title;
  let displaySubtitle = subtitle;

  // If title contains " • ", split into 2 distinct lines (English top, Urdu bottom)
  if (!displaySubtitle && title && title.includes(' • ')) {
    const parts = title.split(' • ');
    displayTitle = parts[0].trim();
    displaySubtitle = parts[1].trim();
  }

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let bg = BrandColors.primary;
    let border = 'transparent';

    switch (variant) {
      case 'primary':
        bg = BrandColors.primary;
        break;
      case 'secondary':
        bg = theme.backgroundElement;
        break;
      case 'outline':
        bg = 'transparent';
        border = theme.border;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      opacity: isDisabled ? 0.6 : pressed ? 0.88 : 1,
    };
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return theme.text;
      case 'outline':
        return theme.text;
      case 'ghost':
        return BrandColors.primaryLight;
      default:
        return '#FFFFFF';
    }
  };

  const sizeStyle = {
    small: styles.buttonSmall,
    medium: styles.buttonMedium,
    large: styles.buttonLarge,
  }[size];

  const textSizeStyle = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  }[size];

  const textColor = getTextColor();

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.buttonBase,
        sizeStyle,
        getContainerStyle(pressed),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : BrandColors.primaryLight}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : 18}
              color={textColor}
              style={styles.leftIcon}
            />
          )}
          <View style={styles.textColumn}>
            <Text style={[styles.textBase, textSizeStyle, { color: textColor }, textStyle]}>
              {displayTitle}
            </Text>
            {displaySubtitle ? (
              <Text
                style={[
                  styles.subtitleBase,
                  size === 'small' ? styles.subSmall : styles.subMedium,
                  {
                    color: variant === 'primary' ? 'rgba(255, 255, 255, 0.95)' : '#000000',
                  },
                  subtitleStyle,
                ]}>
                {displaySubtitle}
              </Text>
            ) : null}
          </View>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : 18}
              color={textColor}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease',
      } as any,
    }),
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    minHeight: 36,
  },
  buttonMedium: {
    paddingVertical: 11,
    paddingHorizontal: Spacing.four,
    minHeight: 44,
  },
  buttonLarge: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    minHeight: 52,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 13,
  },
  textMedium: {
    fontSize: 15,
  },
  textLarge: {
    fontSize: 16,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  textColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  subtitleBase: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subSmall: {
    fontSize: 11,
    lineHeight: 14,
  },
  subMedium: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  subLarge: {
    fontSize: 13.5,
    lineHeight: 18,
  },
});
