/**
 * Centralized API client service for Q-IRRIGATE Django REST backend.
 */

import {
  BenchmarkReport,
  DefaultScenario,
  HealthStatus,
  OptimizationRequest,
  OptimizationResponse,
  OptimizationRunRecord,
  SolarProfileResponse,
  AuthResponse,
  UserListResponse,
  UserRole,
} from '@/types/api';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
      });

      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch {
          errorData = { error: res.statusText };
        }
        const message =
          errorData.details
            ? JSON.stringify(errorData.details)
            : errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(
          `Unable to connect to Django API at ${API_BASE_URL}. Ensure the backend server is running on http://127.0.0.1:8000.`
        );
      }
      throw err;
    }
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health/');
  }

  async getDefaultScenario(): Promise<DefaultScenario> {
    return this.request<DefaultScenario>('/scenario/default/');
  }

  async optimizeSchedule(
    payload: OptimizationRequest
  ): Promise<OptimizationResponse> {
    return this.request<OptimizationResponse>('/optimize/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getBenchmark(): Promise<BenchmarkReport> {
    return this.request<BenchmarkReport>('/benchmark/');
  }

  async getSolarProfile(): Promise<SolarProfileResponse> {
    return this.request<SolarProfileResponse>('/solar-profile/');
  }

  async getHistory(): Promise<{ count: number; runs: OptimizationRunRecord[] }> {
    return this.request<{ count: number; runs: OptimizationRunRecord[] }>(
      '/history/'
    );
  }

  async getTelemetry(): Promise<{
    status: string;
    telemetry: {
      soil_moisture: number;
      temperature: number;
      pump_status: string;
      water_flow: number;
      energy_meter: number;
      device_health: number;
      solar_power: number;
      gateway_id: string;
      zone_active: string;
      is_live_stream: boolean;
      last_updated: string;
    };
  }> {
    return this.request('/telemetry/');
  }

  async postTelemetry(payload: Record<string, any>): Promise<any> {
    return this.request('/telemetry/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAnomalyDiagnostics(scenario?: string, customData?: any): Promise<any> {
    if (scenario || customData) {
      return this.request('/telemetry/anomaly/', {
        method: 'POST',
        body: JSON.stringify({ scenario, ...customData }),
      });
    }
    return this.request('/telemetry/anomaly/');
  }

  async login(payload: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: {
    email: string;
    password: string;
    full_name?: string;
    username?: string;
    location?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUsers(): Promise<UserListResponse> {
    return this.request<UserListResponse>('/auth/users/');
  }

  async updateUserRole(
    userId: number,
    role: UserRole,
    details?: { location?: string; is_active?: boolean }
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>(`/auth/users/${userId}/role/`, {
      method: 'PATCH',
      body: JSON.stringify({ role, ...details }),
    });
  }

  async deleteUser(userId: number): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/auth/users/${userId}/delete/`, {
      method: 'DELETE',
    });
  }

  async forgotPassword(email: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }
}

export const apiService = new ApiService();

