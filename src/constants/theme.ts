/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#1E3A8A',
    accent: '#D97706',
    border: '#E2E8F0',
    inputBg: '#F8FAFC',
    card: '#FFFFFF',
    error: '#EF4444',
  },
  dark: {
    text: '#ffffff',
    background: '#0B0F19',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#94A3B8',
    primary: '#3B82F6',
    accent: '#F59E0B',
    border: '#334155',
    inputBg: '#111827',
    card: '#1E293B',
    error: '#F87171',
  },
} as const;

export const BrandColors = {
  primary: '#1E3A8A', // Royal Tailor Blue
  primaryLight: '#2563EB',
  primaryDark: '#0F172A',
  accent: '#D97706', // Golden Stitch / Brass Measuring Tape
  accentLight: '#F59E0B',
  accentMuted: '#FEF3C7',
  success: '#10B981',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  border: '#E2E8F0',
  borderDark: '#334155',
  card: '#FFFFFF',
  cardDark: '#1E293B',
  inputBg: '#F8FAFC',
  inputBgDark: '#0F172A',
  mutedText: '#64748B',
  placeholder: '#94A3B8',
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
