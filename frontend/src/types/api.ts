/**
 * Strict TypeScript interface definitions for Q-IRRIGATE API contracts.
 */

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  environment: {
    python_version: string;
    qiskit_version: string;
    operating_system: string;
  };
}

export interface DefaultScenario {
  scenario_name: string;
  location: string;
  solar_date: string;
  time_convention: string;
  defaults: {
    zones: string[];
    planning_hours: number[];
    demand_litres: number;
    flow_litres_per_hour: number;
    pump_power_kw: number;
    panel_capacity_kw: number;
    solar_performance_factor: number;
    grid_tariff_rupees_per_kwh: number;
    grid_limit_kw: number;
    max_pumps_running: number;
    solver: 'classical' | 'qaoa' | 'compare';
    qaoa_seed: number;
    qaoa_reps: number;
    qaoa_maxiter: number;
    qubo_penalty: number;
  };
  supported_solvers: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  units: Record<string, string>;
  scientific_caveats: string[];
}

export interface ScheduleSlot {
  hour_local_solar_time: number;
  running_zones: string;
  active_pumps_count: number;
  estimated_pv_kw: number;
  pump_load_kw: number;
  grid_import_kw: number;
  grid_cost_rupees: number;
  water_delivered_litres: number;
}

export interface ZoneMetric {
  hours_active: number;
  water_delivered_litres: number;
  demand_litres: number;
  deficit_litres: number;
  demand_met: boolean;
}

export interface OptimizationSummary {
  is_feasible: boolean;
  total_cost_rupees: number | null;
  total_grid_energy_kwh: number | null;
  total_water_delivered_litres: number;
  total_pv_generated_kwh: number;
  total_pump_energy_kwh: number;
  zone_metrics: Record<string, ZoneMetric>;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  status_message: string;
}

export interface ComparisonData {
  classical_cost_rupees: number | null;
  qaoa_cost_rupees: number | null;
  cost_difference_rupees: number | null;
  relative_gap_pct: number | null;
  both_feasible: boolean;
  classical_execution_time_ms?: number;
  qaoa_execution_time_ms?: number;
  scientific_honesty_notice: string;
}

export interface OptimizationRequest {
  zones?: string[];
  planning_hours?: number[];
  demand_litres?: number;
  flow_litres_per_hour?: number;
  pump_power_kw?: number;
  panel_capacity_kw?: number;
  solar_performance_factor?: number;
  grid_tariff_rupees_per_kwh?: number;
  grid_limit_kw?: number;
  max_pumps_running?: number;
  solver: 'classical' | 'qaoa' | 'compare';
  qaoa_seed?: number;
  qaoa_reps?: number;
  qaoa_maxiter?: number;
  qubo_penalty?: number;
}

export interface OptimizationResponse {
  request_id?: string;
  solver: string;
  solver_name: string;
  is_feasible: boolean;
  status_message: string;
  schedule: ScheduleSlot[];
  summary: OptimizationSummary;
  validation: ValidationResult;
  execution_time_ms?: number;
  classical?: OptimizationResponse;
  qaoa?: OptimizationResponse;
  comparison?: ComparisonData;
  qaoa_params?: {
    seed: number;
    reps: number;
    maxiter: number;
    penalty: number;
  };
  assumptions_and_notes?: {
    solar_date: string;
    time_convention: string;
    panel_capacity_kw: number;
    performance_factor: number;
    currency: string;
    disclaimer: string;
  };
}

export interface BenchmarkTrial {
  seed: number;
  feasible: boolean;
  grid_cost_rupees: number | null;
  status: string;
}

export interface BenchmarkSummaryItem {
  method: string;
  cost_rupees: number;
}

export interface BenchmarkReport {
  summary: BenchmarkSummaryItem[];
  trials: BenchmarkTrial[];
  report_markdown: string;
  exact_classical_cost: number;
  best_qaoa_cost: number;
  cost_gap: number;
  feasible_trials_count: number;
  total_trials_count: number;
  tested_seeds: number[];
  statement: string;
}

export interface SolarHourlyRecord {
  hour: number;
  timestamp: string;
  allsky_sfc_sw_dwn: number;
  solar_energy_kwh_m2: number;
  temperature_c: number;
  relative_humidity_pct: number;
  precipitation_mm: number;
}

export interface SolarProfileResponse {
  metadata: {
    date: string;
    location: string;
    source: string;
    time_convention: string;
    radiation_unit: string;
    conversion_to_kwh: string;
    pv_model_status: string;
    disclaimer: string;
  };
  records: SolarHourlyRecord[];
}

export interface OptimizationRunRecord {
  id: string;
  created_at: string;
  solver: string;
  is_feasible: boolean;
  status_message: string;
  demand_litres: number;
  pump_power_kw: number;
  panel_capacity_kw: number;
  tariff_rupees_per_kwh: number;
  total_cost_rupees: number | null;
  total_water_delivered_litres: number | null;
  total_grid_import_kwh: number | null;
  total_pv_generated_kwh: number | null;
  execution_time_ms: number | null;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
}

export type UserRole =
  | 'SUPERADMIN'
  | 'FIELD_ENGINEER'
  | 'AGRONOMIST'
  | 'FARMER'
  | 'PENDING';

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  location: string;
  phone?: string;
  gateway_id?: string;
  is_superuser: boolean;
  is_active: boolean;
  date_joined?: string;
  status: 'ACTIVE' | 'PENDING';
}

export interface AuthResponse {
  status: string;
  token?: string;
  user: UserAccount;
  message?: string;
}

export interface UserListResponse {
  status: string;
  total_count: number;
  users: UserAccount[];
}

