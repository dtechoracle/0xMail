/**
 * API Client for 0xMail Backend
 * Use this in your frontend components to make API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      if (headers instanceof Headers) {
        headers.set('Authorization', `Bearer ${this.token}`);
      } else if (Array.isArray(headers)) {
        headers.push(['Authorization', `Bearer ${this.token}`]);
      } else {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Return detailed error message
        const errorMessage = data.message || this.getErrorMessage(response.status);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection');
      }
      throw error;
    }
  }

  private getErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again';
      case 401:
        return 'Session expired. Please login again';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 409:
        return 'This resource already exists';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'Server error. Please try again later';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  }

  // Auth endpoints
  async signup(email: string, password: string, name?: string) {
    const data = await this.request<{
      success: boolean;
      data: { user: any; token: string };
    }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{
      success: boolean;
      data: { user: any; token: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; data: { user: any } }>(
      '/api/auth/me'
    );
  }

  logout() {
    this.clearToken();
  }

  // Email endpoints
  async getEmails(params?: {
    page?: number;
    limit?: number;
    status?: 'safe' | 'suspicious' | 'malicious';
    starred?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.starred) searchParams.set('starred', 'true');

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: {
        emails: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/api/emails${query ? `?${query}` : ''}`);
  }

  async getEmail(id: string) {
    return this.request<{
      success: boolean;
      data: { email: any };
    }>(`/api/emails/${id}`);
  }

  async updateEmail(id: string, data: { isRead?: boolean; isStarred?: boolean }) {
    return this.request<{
      success: boolean;
      data: { email: any };
    }>(`/api/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmail(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/emails/${id}`, {
      method: 'DELETE',
    });
  }

  // Stats endpoint
  async getStats() {
    return this.request<{
      success: boolean;
      data: {
        totalProcessed: number;
        safeEmails: number;
        suspiciousEmails: number;
        threatsBlocked: number;
      };
    }>('/api/stats');
  }

  // User Profile endpoints
  async getProfile() {
    return this.request<{
      success: boolean;
      data: { user: any };
    }>('/api/user/profile');
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.request<{
      success: boolean;
      message: string;
      data: { user: any };
    }>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/user/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Settings endpoints
  async getSettings() {
    return this.request<{
      success: boolean;
      data: { settings: any };
    }>('/api/settings');
  }

  async updateSettings(settings: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: { settings: any };
    }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Email Accounts endpoints
  async getEmailAccounts() {
    return this.request<{
      success: boolean;
      data: { emailAccounts: any[] };
    }>('/api/email-accounts');
  }

  async connectEmailAccount(data: {
    provider: 'gmail' | 'outlook' | 'custom';
    email: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: { emailAccount: any };
    }>('/api/email-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disconnectEmailAccount(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/email-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleEmailAccount(id: string, isActive: boolean) {
    return this.request<{
      success: boolean;
      message: string;
      data: { emailAccount: any };
    }>(`/api/email-accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Quarantine endpoints
  async getQuarantinedEmails(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: {
        quarantinedEmails: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/api/quarantine${query ? `?${query}` : ''}`);
  }

  async quarantineAction(
    id: string,
    action: 'release' | 'delete' | 'block_sender'
  ) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/quarantine/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async deleteQuarantinedEmail(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/quarantine/${id}`, {
      method: 'DELETE',
    });
  }

  // Gmail OAuth endpoints
  async getGmailAuthUrl() {
    return this.request<{
      success: boolean;
      data: { authUrl: string };
    }>('/api/gmail/authorize');
  }

  async syncGmailAccount(emailAccountId: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        imported: number;
        scanned: number;
        total: number;
      };
    }>('/api/gmail/sync', {
      method: 'POST',
      body: JSON.stringify({ emailAccountId }),
    });
  }

  // Outlook OAuth endpoints
  async getOutlookAuthUrl() {
    return this.request<{
      success: boolean;
      data: { authUrl: string };
    }>('/api/outlook/authorize');
  }

  async syncOutlookAccount(emailAccountId: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        imported: number;
        scanned: number;
        total: number;
      };
    }>('/api/outlook/sync', {
      method: 'POST',
      body: JSON.stringify({ emailAccountId }),
    });
  }
}

// Export a singleton instance
export const apiClient = new APIClient();

// Export the class for creating new instances if needed
export default APIClient;

