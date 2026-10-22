"""Tests for optimizer and validator service logic."""

import pytest
from irrigation.services import optimizer_service, validator_service, solar_service


def test_solar_service_pv_generation():
    pv_kw, solar_energy = solar_service.compute_pv_generation(
        hours=[7, 8, 9, 10, 11, 12],
        panel_capacity_kw=2.0,
        performance_factor=0.8,
    )
    assert len(pv_kw) == 6
    assert (pv_kw >= 0).all()
    # Peak solar hours should generate positive power
    assert pv_kw[3] > 0.5  # Hour 10


def test_classical_exact_solver():
    res = optimizer_service.solve_classical(
        zones=["Zone_A", "Zone_B"],
        hours=[7, 8, 9, 10, 11, 12],
        demand_litres=1000.0,
        flow_litres_per_hour=500.0,
        pump_power_kw=1.5,
        panel_capacity_kw=2.0,
        solar_performance_factor=0.80,
        grid_tariff_rupees_per_kwh=7.0,
        grid_limit_kw=1.5,
        max_pumps_running=1,
    )
    assert res["is_feasible"] is True
    assert res["validation"]["passed"] is True
    assert abs(res["summary"]["total_cost_rupees"] - 8.2444) < 0.05
    assert res["summary"]["total_water_delivered_litres"] == 2000.0


def test_validator_detects_unmet_demand():
    # Only 1 slot assigned for Zone_A (500L < 1000L)
    assignment = {
        ("Zone_A", 7): 1,
        ("Zone_A", 8): 0,
        ("Zone_B", 7): 0,
        ("Zone_B", 8): 0,
    }
    schedule_rows, summary, validation = validator_service.validate_and_build_schedule(
        assignment=assignment,
        zones=["Zone_A", "Zone_B"],
        hours=[7, 8],
        pv_kw=optimizer_service.np.array([0.2, 0.5]),
        demand_litres=1000.0,
        flow_litres_per_hour=500.0,
        pump_power_kw=1.5,
        grid_tariff=7.0,
    )
    assert validation["passed"] is False
    assert any("not satisfied" in err for err in validation["errors"])


def test_validator_detects_pump_collision():
    # 2 pumps running at same hour when max=1
    assignment = {
        ("Zone_A", 7): 1,
        ("Zone_B", 7): 1,
    }
    schedule_rows, summary, validation = validator_service.validate_and_build_schedule(
        assignment=assignment,
        zones=["Zone_A", "Zone_B"],
        hours=[7],
        pv_kw=optimizer_service.np.array([0.2]),
        demand_litres=500.0,
        flow_litres_per_hour=500.0,
        pump_power_kw=1.5,
        grid_tariff=7.0,
        max_pumps_running=1,
    )
    assert validation["passed"] is False
    assert any("Pump limit exceeded" in err for err in validation["errors"])


def test_qaoa_solver_integration():
    # Fast test with low iterations
    res = optimizer_service.solve_qaoa(
        zones=["Zone_A", "Zone_B"],
        hours=[7, 8, 9, 10, 11, 12],
        demand_litres=1000.0,
        flow_litres_per_hour=500.0,
        pump_power_kw=1.5,
        panel_capacity_kw=2.0,
        solar_performance_factor=0.80,
        grid_tariff_rupees_per_kwh=7.0,
        grid_limit_kw=1.5,
        max_pumps_running=1,
        qaoa_seed=7,
        qaoa_reps=1,
        qaoa_maxiter=25,
    )
    assert res["solver"] == "qaoa"
    assert "summary" in res
    assert "validation" in res
    assert res["execution_time_ms"] > 0
    assert len(res["schedule"]) == 6


def test_compare_solver_integration():
    res = optimizer_service.solve_compare(
        zones=["Zone_A", "Zone_B"],
        hours=[7, 8, 9, 10, 11, 12],
        demand_litres=1000.0,
        flow_litres_per_hour=500.0,
        pump_power_kw=1.5,
        panel_capacity_kw=2.0,
        solar_performance_factor=0.80,
        grid_tariff_rupees_per_kwh=7.0,
        grid_limit_kw=1.5,
        max_pumps_running=1,
        qaoa_seed=7,
        qaoa_reps=1,
        qaoa_maxiter=20,
    )
    assert res["solver"] == "compare"
    assert "classical" in res
    assert "qaoa" in res
    assert "comparison" in res
    assert "scientific_honesty_notice" in res["comparison"]

