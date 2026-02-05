// Client API pour communiquer avec le backend NestJS

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiError {
  message: string;
  statusCode: number;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    neighborhood?: string;
    role: string;
  };
  access_token: string;
  refresh_token?: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Récupérer le token depuis localStorage au démarrage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
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
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'Une erreur est survenue',
        statusCode: response.status,
      }));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return response.json();
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    neighborhood?: string;
  }): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<LoginResponse['user']> {
    return this.request<LoginResponse['user']>('/auth/profile');
  }

  async updateProfile(data: {
    fullName?: string;
    phone?: string;
    neighborhood?: string;
  }): Promise<LoginResponse['user']> {
    return this.request<LoginResponse['user']>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.setToken(null);
  }

  // ==================== PRODUCTS ====================

  async getProducts() {
    return this.request<any[]>('/products');
  }

  async getAllProducts() {
    return this.request<any[]>('/products/all');
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getLowStockProducts() {
    return this.request<any[]>('/products/low-stock');
  }

  // ==================== ORDERS ====================

  async getOrders() {
    return this.request<any[]>('/orders');
  }

  async getMyOrders() {
    return this.request<any[]>('/orders/my-orders');
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async createOrder(data: {
    items: { productId: string; quantity: number }[];
    fullName: string;
    phone: string;
    deliveryAddress: string;
    neighborhood?: string;
    notes?: string;
    paymentMethod?: string;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: string, status: string, driverId?: string) {
    return this.request<any>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, driverId }),
    });
  }

  async assignDriver(orderId: string, driverId: string) {
    return this.request<any>(`/orders/${orderId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ driverId }),
    });
  }

  async cancelOrder(id: string) {
    return this.request<any>(`/orders/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  async getOrderStatistics() {
    return this.request<any>('/orders/statistics');
  }

  // ==================== DRIVERS ====================

  async getDrivers() {
    return this.request<any[]>('/drivers');
  }

  async getAvailableDrivers() {
    return this.request<any[]>('/drivers/available');
  }

  async createDriver(data: any) {
    return this.request<any>('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDriver(id: string, data: any) {
    return this.request<any>(`/drivers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDriver(id: string) {
    return this.request<any>(`/drivers/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== USERS ====================

  async getUsers() {
    return this.request<any[]>('/users');
  }

  async searchUsers(query: string) {
    return this.request<any[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async updateUserRole(id: string, role: string) {
    return this.request<any>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }
}

// Export une instance unique
export const api = new ApiClient();

// Export aussi la classe pour les tests
export { ApiClient };
