import { apiClient, setAuthToken, setCachedUser } from './client';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    shop: {
      _id: string;
      name: string;
      urdu_name?: string;
      contact_phone?: string;
      contact_email?: string;
      address?: string;
      currency?: string;
    };
  };
}

export const authApi = {
  /**
   * Log in tailor with email or mobile phone and password
   */
  login: async (identifier: string, pass: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      identifier: identifier.trim(),
      password: pass,
    });
    const data = response.data;
    if (data.access_token) {
      await setAuthToken(data.access_token);
      await setCachedUser(data.user);
    }
    return data;
  },

  /**
   * Sign up new tailor shop & admin account
   */
  signup: async (payload: {
    shop_name: string;
    shop_urdu_name?: string;
    full_name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/signup', payload);
    const data = response.data;
    if (data.access_token) {
      await setAuthToken(data.access_token);
      await setCachedUser(data.user);
    }
    return data;
  },

  /**
   * Forgot password Step 1: Check email and request verification code
   */
  forgotPassword: async (email: string): Promise<{ message: string; verification_code?: string; email: string }> => {
    const response = await apiClient.post('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return response.data;
  },

  /**
   * Forgot password Step 2: Verify 6-digit code
   */
  verifyCode: async (email: string, code: string): Promise<{ message: string; valid: boolean }> => {
    const response = await apiClient.post('/auth/verify-code', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
    return response.data;
  },

  /**
   * Forgot password Step 3: Set new password
   */
  resetPassword: async (
    email: string,
    code: string,
    newPass: string
  ): Promise<{ message: string; success: boolean }> => {
    const response = await apiClient.post('/auth/reset-password', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      new_password: newPass,
    });
    return response.data;
  },

  /**
   * Fetch current authenticated tailor profile
   */
  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
