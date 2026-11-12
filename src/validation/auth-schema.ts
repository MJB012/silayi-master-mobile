import * as Yup from 'yup';

/**
 * Validation schema for Tailor Sign Up
 * Required fields:
 * - Shop Name
 * - Tailor's Name
 * - Phone Number
 * - Email
 * - Password
 */
export const signupValidationSchema = Yup.object().shape({
  shopName: Yup.string()
    .trim()
    .min(2, 'Shop name must be at least 2 characters')
    .max(60, 'Shop name cannot exceed 60 characters')
    .required('Shop name is required (e.g. Master Tailors)'),

  name: Yup.string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, and hyphens')
    .required('Tailor or owner name is required'),

  phone: Yup.string()
    .trim()
    .required('Phone number is required')
    .test(
      'is-valid-phone',
      'Please enter a valid phone number (e.g. 03001234567 or +923001234567)',
      (value) => {
        if (!value) return false;
        // Clean spaces, hyphens, parentheses
        const clean = value.replace(/[\s\-()]/g, '');
        // Must contain only digits with optional leading + and length 7 to 15 digits
        return /^\+?[0-9]{7,15}$/.test(clean);
      }
    ),

  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email address is required'),

  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(40, 'Password cannot exceed 40 characters'),
});

export type SignupFormValues = Yup.InferType<typeof signupValidationSchema>;

/**
 * Validation schema for Tailor Login
 * Accepts either:
 * - Valid email format (e.g. tailor@example.com)
 * - Valid phone number (e.g. 03001234567 or +923001234567)
 * Along with password.
 */
export const loginValidationSchema = Yup.object().shape({
  identifier: Yup.string()
    .trim()
    .required('Email or Phone number is required')
    .test(
      'is-valid-email-or-phone',
      'Enter a valid email address or phone number',
      (value) => {
        if (!value) return false;
        const clean = value.trim();

        // Check if valid email
        const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean);
        if (isEmail) return true;

        // Check if valid phone number
        const cleanPhone = clean.replace(/[\s\-()]/g, '');
        const isPhone = /^\+?[0-9]{7,15}$/.test(cleanPhone);
        return isPhone;
      }
    ),

  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = Yup.InferType<typeof loginValidationSchema>;

/**
 * Validation schema for Forgot Password: Step 1 (Enter Email)
 */
export const forgotPasswordEmailSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email address is required'),
});

export type ForgotPasswordEmailValues = Yup.InferType<typeof forgotPasswordEmailSchema>;

/**
 * Validation schema for Forgot Password: Step 2 (Verification Code)
 */
export const forgotPasswordCodeSchema = Yup.object().shape({
  code: Yup.string()
    .trim()
    .matches(/^[0-9]{4,6}$/, 'Please enter a valid 4 to 6 digit code')
    .required('Verification code is required'),
});

export type ForgotPasswordCodeValues = Yup.InferType<typeof forgotPasswordCodeSchema>;

/**
 * Validation schema for Forgot Password: Step 3 (Reset Password)
 */
export const forgotPasswordResetSchema = Yup.object().shape({
  password: Yup.string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(40, 'Password cannot exceed 40 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
});

export type ForgotPasswordResetValues = Yup.InferType<typeof forgotPasswordResetSchema>;
