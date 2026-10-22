"""Quantum and Classical Optimization Service for Q-IRRIGATE.

Implements:
1. Exact classical MILP solver (SciPy milp)
2. Quantum QAOA solver (Qiskit + Qiskit Optimization + StatevectorSampler)
3. Exact QUBO eigensolver reference (NumPyMinimumEigensolver)
4. Comparative solver engine
"""

import time
import uuid
from typing import Dict, List, Optional, Tuple
import numpy as np
from scipy.optimize import Bounds, LinearConstraint, milp
from scipy.sparse import lil_matrix

from qiskit.primitives import StatevectorSampler
from qiskit_algorithms import QAOA, NumPyMinimumEigensolver
from qiskit_algorithms.optimizers import COBYLA
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

from .solar_service import compute_pv_generation
from .validator_service import validate_and_build_schedule


def solve_classical(
    zones: List[str],
    hours: List[int],
    demand_litres: float,
    flow_litres_per_hour: float,
    pump_power_kw: float,
    panel_capacity_kw: float,
    solar_performance_factor: float,
    grid_tariff_rupees_per_kwh: float,
    grid_limit_kw: float = 1.5,
    max_pumps_running: int = 1,
) -> Dict:
    """Solve the irrigation scheduling problem using exact classical MILP."""
    start_time = time.perf_counter()

    pv_kw, _ = compute_pv_generation(
        hours, panel_capacity_kw, solar_performance_factor
    )

    n_zones = len(zones)
    n_hours = len(hours)
    n_x = n_zones * n_hours
    n_vars = n_x + n_hours  # Binary x + continuous grid import g

    def x_idx(z: int, s: int) -> int:
        return z * n_hours + s

    def g_idx(s: int) -> int:
        return n_x + s

    # Check basic feasibility before invoking solver
    required_hours_per_zone = int(np.ceil(demand_litres / flow_litres_per_hour))
    total_required_hours = required_hours_per_zone * n_zones
    total_available_capacity = n_hours * max_pumps_running

    if total_required_hours > total_available_capacity:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        unmet_hours = total_required_hours - total_available_capacity
        unmet_litres = unmet_hours * flow_litres_per_hour
        return {
            "solver": "classical",
            "solver_name": "Classical Exact (SciPy MILP)",
            "is_feasible": False,
            "status_message": (
                f"Infeasible demand: Total required pump hours ({total_required_hours}h) exceeds "
                f"available planning capacity ({total_available_capacity}h = {n_hours} slots * {max_pumps_running} pump limit). "
                f"Unmet demand: {unmet_litres:.1f} Litres."
            ),
            "schedule": [],
            "summary": {
                "is_feasible": False,
                "total_cost_rupees": None,
                "total_grid_energy_kwh": None,
                "total_water_delivered_litres": 0.0,
                "total_pv_generated_kwh": round(float(np.sum(pv_kw)), 4),
                "total_pump_energy_kwh": 0.0,
                "zone_metrics": {
                    z: {"hours_active": 0, "water_delivered_litres": 0, "demand_litres": demand_litres, "deficit_litres": demand_litres, "demand_met": False}
                    for z in zones
                },
            },
            "validation": {
                "passed": False,
                "errors": [f"Insufficient time slots ({n_hours}) to supply required water demand ({demand_litres} L/zone)."],
                "warnings": [],
                "status_message": "Problem is mathematically infeasible under given constraints.",
            },
            "execution_time_ms": round(elapsed_ms, 2),
        }

    # Objective: minimize tariff * grid_import
    objective = np.zeros(n_vars)
    objective[n_x:] = grid_tariff_rupees_per_kwh

    lower = np.zeros(n_vars)
    upper = np.ones(n_vars)
    upper[n_x:] = grid_limit_kw
    integrality = np.zeros(n_vars, dtype=int)
    integrality[:n_x] = 1

    rows = []
    row_lower = []
    row_upper = []

    # 1. Zone water requirements
    for z in range(n_zones):
        row = np.zeros(n_vars)
        for s in range(n_hours):
            row[x_idx(z, s)] = flow_litres_per_hour
        rows.append(row)
        row_lower.append(demand_litres)
        row_upper.append(np.inf)

    # 2. Max simultaneous pumps
    for s in range(n_hours):
        row = np.zeros(n_vars)
        for z in range(n_zones):
            row[x_idx(z, s)] = 1
        rows.append(row)
        row_lower.append(-np.inf)
        row_upper.append(max_pumps_running)

    # 3. Grid deficit balance: pump_power * sum(x) - g <= pv_kw
    for s in range(n_hours):
        row = np.zeros(n_vars)
        for z in range(n_zones):
            row[x_idx(z, s)] = pump_power_kw
        row[g_idx(s)] = -1.0
        rows.append(row)
        row_lower.append(-np.inf)
        row_upper.append(float(pv_kw[s]))

    matrix = lil_matrix(np.vstack(rows))
    constraints = LinearConstraint(
        matrix.tocsr(),
        np.asarray(row_lower),
        np.asarray(row_upper),
    )

    res = milp(
        c=objective,
        integrality=integrality,
        bounds=Bounds(lower, upper),
        constraints=constraints,
        options={"time_limit": 30},
    )

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    if not res.success or res.x is None:
        return {
            "solver": "classical",
            "solver_name": "Classical Exact (SciPy MILP)",
            "is_feasible": False,
            "status_message": f"Optimization did not find an optimal schedule: {res.message}",
            "schedule": [],
            "summary": {"is_feasible": False, "total_cost_rupees": None},
            "validation": {"passed": False, "errors": [res.message], "warnings": []},
            "execution_time_ms": round(elapsed_ms, 2),
        }

    # Decode assignment
    assignment = {}
    for z_i, zone in enumerate(zones):
        for s_i, hour in enumerate(hours):
            val = int(np.round(res.x[x_idx(z_i, s_i)]))
            assignment[(zone, hour)] = val

    schedule_rows, summary, validation = validate_and_build_schedule(
        assignment=assignment,
        zones=zones,
        hours=hours,
        pv_kw=pv_kw,
        demand_litres=demand_litres,
        flow_litres_per_hour=flow_litres_per_hour,
        pump_power_kw=pump_power_kw,
        grid_tariff=grid_tariff_rupees_per_kwh,
        grid_limit_kw=grid_limit_kw,
        max_pumps_running=max_pumps_running,
    )

    return {
        "solver": "classical",
        "solver_name": "Classical Exact (SciPy MILP)",
        "is_feasible": summary["is_feasible"],
        "status_message": "Optimal schedule determined successfully." if summary["is_feasible"] else validation["status_message"],
        "schedule": schedule_rows,
        "summary": summary,
        "validation": validation,
        "execution_time_ms": round(elapsed_ms, 2),
    }


def build_qubo_problem(
    zones: List[str],
    hours: List[int],
    demand_litres: float,
    flow_litres_per_hour: float,
    pump_power_kw: float,
    panel_capacity_kw: float,
    solar_performance_factor: float,
    grid_tariff_rupees_per_kwh: float,
    max_pumps_running: int = 1,
) -> Tuple[QuadraticProgram, np.ndarray]:
    """Build the Qiskit QuadraticProgram for the irrigation problem."""
    pv_kw, _ = compute_pv_generation(
        hours, panel_capacity_kw, solar_performance_factor
    )

    # Cost of operating 1 pump in slot s
    slot_cost = grid_tariff_rupees_per_kwh * np.maximum(
        0.0, pump_power_kw - pv_kw
    )

    problem = QuadraticProgram("q_irrigate_qubo")

    # Binary variables x_zone_hour
    for zone in zones:
        for hour in hours:
            problem.binary_var(name=f"x_{zone}_{hour}")

    # Objective: minimize sum slot_cost * x
    linear_obj = {
        f"x_{zone}_{hour}": float(slot_cost[i])
        for zone in zones
        for i, hour in enumerate(hours)
    }
    problem.minimize(linear=linear_obj)

    required_hours = int(np.ceil(demand_litres / flow_litres_per_hour))

    for zone in zones:
        problem.linear_constraint(
            linear={f"x_{zone}_{hour}": 1 for hour in hours},
            sense="==",
            rhs=required_hours,
            name=f"demand_{zone}",
        )

    for hour in hours:
        problem.linear_constraint(
            linear={f"x_{zone}_{hour}": 1 for zone in zones},
            sense="<=",
            rhs=max_pumps_running,
            name=f"max_pumps_{hour}",
        )

    return problem, pv_kw


def solve_qaoa(
    zones: List[str],
    hours: List[int],
    demand_litres: float,
    flow_litres_per_hour: float,
    pump_power_kw: float,
    panel_capacity_kw: float,
    solar_performance_factor: float,
    grid_tariff_rupees_per_kwh: float,
    grid_limit_kw: float = 1.5,
    max_pumps_running: int = 1,
    qaoa_seed: int = 7,
    qaoa_reps: int = 2,
    qaoa_maxiter: int = 150,
    qubo_penalty: float = 1000.0,
) -> Dict:
    """Solve the irrigation scheduling problem using Qiskit QAOA."""
    start_time = time.perf_counter()

    # Pre-feasibility check
    required_hours_per_zone = int(np.ceil(demand_litres / flow_litres_per_hour))
    total_required = required_hours_per_zone * len(zones)
    total_capacity = len(hours) * max_pumps_running

    if total_required > total_capacity:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return {
            "solver": "qaoa",
            "solver_name": f"Quantum QAOA (seed={qaoa_seed}, reps={qaoa_reps})",
            "is_feasible": False,
            "status_message": f"Infeasible: Required hours ({total_required}) exceeds slot capacity ({total_capacity}).",
            "schedule": [],
            "summary": {"is_feasible": False, "total_cost_rupees": None},
            "validation": {"passed": False, "errors": ["Insufficient slots for demanded water."], "warnings": []},
            "execution_time_ms": round(elapsed_ms, 2),
            "qaoa_params": {"seed": qaoa_seed, "reps": qaoa_reps, "maxiter": qaoa_maxiter, "penalty": qubo_penalty},
        }

    try:
        problem, pv_kw = build_qubo_problem(
            zones=zones,
            hours=hours,
            demand_litres=demand_litres,
            flow_litres_per_hour=flow_litres_per_hour,
            pump_power_kw=pump_power_kw,
            panel_capacity_kw=panel_capacity_kw,
            solar_performance_factor=solar_performance_factor,
            grid_tariff_rupees_per_kwh=grid_tariff_rupees_per_kwh,
            max_pumps_running=max_pumps_running,
        )

        qaoa = QAOA(
            sampler=StatevectorSampler(seed=qaoa_seed),
            optimizer=COBYLA(maxiter=qaoa_maxiter),
            reps=qaoa_reps,
        )

        quantum_optimizer = MinimumEigenOptimizer(
            qaoa,
            penalty=qubo_penalty,
        )

        raw_result = quantum_optimizer.solve(problem)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        if raw_result.x is None:
            return {
                "solver": "qaoa",
                "solver_name": f"Quantum QAOA (seed={qaoa_seed}, reps={qaoa_reps})",
                "is_feasible": False,
                "status_message": "QAOA returned no solution vector.",
                "schedule": [],
                "summary": {"is_feasible": False, "total_cost_rupees": None},
                "validation": {"passed": False, "errors": ["No solution returned."], "warnings": []},
                "execution_time_ms": round(elapsed_ms, 2),
                "qaoa_params": {"seed": qaoa_seed, "reps": qaoa_reps, "maxiter": qaoa_maxiter, "penalty": qubo_penalty},
            }

        values = np.asarray(raw_result.x)
        var_names = list(problem.variables_index.keys())

        if len(values) != len(var_names) or not np.isfinite(values).all():
            return {
                "solver": "qaoa",
                "solver_name": f"Quantum QAOA (seed={qaoa_seed}, reps={qaoa_reps})",
                "is_feasible": False,
                "status_message": "QAOA solution contains non-finite or mismatched variables.",
                "schedule": [],
                "summary": {"is_feasible": False, "total_cost_rupees": None},
                "validation": {"passed": False, "errors": ["Non-finite output vector."], "warnings": []},
                "execution_time_ms": round(elapsed_ms, 2),
                "qaoa_params": {"seed": qaoa_seed, "reps": qaoa_reps, "maxiter": qaoa_maxiter, "penalty": qubo_penalty},
            }

        var_dict = dict(zip(var_names, np.rint(values).astype(int)))
        assignment = {}
        for zone in zones:
            for hour in hours:
                assignment[(zone, hour)] = var_dict.get(f"x_{zone}_{hour}", 0)

        schedule_rows, summary, validation = validate_and_build_schedule(
            assignment=assignment,
            zones=zones,
            hours=hours,
            pv_kw=pv_kw,
            demand_litres=demand_litres,
            flow_litres_per_hour=flow_litres_per_hour,
            pump_power_kw=pump_power_kw,
            grid_tariff=grid_tariff_rupees_per_kwh,
            grid_limit_kw=grid_limit_kw,
            max_pumps_running=max_pumps_running,
        )

        return {
            "solver": "qaoa",
            "solver_name": f"Quantum QAOA (seed={qaoa_seed}, reps={qaoa_reps})",
            "is_feasible": summary["is_feasible"],
            "status_message": (
                "Feasible candidate found by QAOA." if summary["is_feasible"]
                else f"QAOA candidate violates constraints: {'; '.join(validation['errors'][:2])}"
            ),
            "schedule": schedule_rows,
            "summary": summary,
            "validation": validation,
            "execution_time_ms": round(elapsed_ms, 2),
            "qaoa_params": {
                "seed": qaoa_seed,
                "reps": qaoa_reps,
                "maxiter": qaoa_maxiter,
                "penalty": qubo_penalty,
            },
        }

    except Exception as exc:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return {
            "solver": "qaoa",
            "solver_name": f"Quantum QAOA (seed={qaoa_seed})",
            "is_feasible": False,
            "status_message": f"QAOA solver execution failed: {type(exc).__name__}: {str(exc)}",
            "schedule": [],
            "summary": {"is_feasible": False, "total_cost_rupees": None},
            "validation": {"passed": False, "errors": [str(exc)], "warnings": []},
            "execution_time_ms": round(elapsed_ms, 2),
            "qaoa_params": {"seed": qaoa_seed, "reps": qaoa_reps, "maxiter": qaoa_maxiter, "penalty": qubo_penalty},
        }


def solve_compare(
    zones: List[str],
    hours: List[int],
    demand_litres: float,
    flow_litres_per_hour: float,
    pump_power_kw: float,
    panel_capacity_kw: float,
    solar_performance_factor: float,
    grid_tariff_rupees_per_kwh: float,
    grid_limit_kw: float = 1.5,
    max_pumps_running: int = 1,
    qaoa_seed: int = 7,
    qaoa_reps: int = 2,
    qaoa_maxiter: int = 150,
    qubo_penalty: float = 1000.0,
) -> Dict:
    """Run both classical MILP and quantum QAOA against the exact same scenario."""
    classical_res = solve_classical(
        zones=zones,
        hours=hours,
        demand_litres=demand_litres,
        flow_litres_per_hour=flow_litres_per_hour,
        pump_power_kw=pump_power_kw,
        panel_capacity_kw=panel_capacity_kw,
        solar_performance_factor=solar_performance_factor,
        grid_tariff_rupees_per_kwh=grid_tariff_rupees_per_kwh,
        grid_limit_kw=grid_limit_kw,
        max_pumps_running=max_pumps_running,
    )

    qaoa_res = solve_qaoa(
        zones=zones,
        hours=hours,
        demand_litres=demand_litres,
        flow_litres_per_hour=flow_litres_per_hour,
        pump_power_kw=pump_power_kw,
        panel_capacity_kw=panel_capacity_kw,
        solar_performance_factor=solar_performance_factor,
        grid_tariff_rupees_per_kwh=grid_tariff_rupees_per_kwh,
        grid_limit_kw=grid_limit_kw,
        max_pumps_running=max_pumps_running,
        qaoa_seed=qaoa_seed,
        qaoa_reps=qaoa_reps,
        qaoa_maxiter=qaoa_maxiter,
        qubo_penalty=qubo_penalty,
    )

    c_cost = classical_res["summary"].get("total_cost_rupees")
    q_cost = qaoa_res["summary"].get("total_cost_rupees")

    cost_diff = None
    rel_gap_pct = None
    if c_cost is not None and q_cost is not None and classical_res["is_feasible"] and qaoa_res["is_feasible"]:
        cost_diff = round(q_cost - c_cost, 4)
        rel_gap_pct = round(((q_cost - c_cost) / c_cost) * 100.0, 2) if c_cost > 1e-6 else 0.0

    comparison_summary = {
        "classical_cost_rupees": c_cost,
        "qaoa_cost_rupees": q_cost,
        "cost_difference_rupees": cost_diff,
        "relative_gap_pct": rel_gap_pct,
        "both_feasible": classical_res["is_feasible"] and qaoa_res["is_feasible"],
        "classical_execution_time_ms": classical_res.get("execution_time_ms"),
        "qaoa_execution_time_ms": qaoa_res.get("execution_time_ms"),
        "scientific_honesty_notice": (
            "This experiment does NOT establish quantum advantage. The exact classical solver "
            "serves as the reference optimum. QAOA explores variational quantum optimization "
            "for agricultural scheduling constraints."
        ),
    }

    # Default schedule to present is classical if feasible, else qaoa
    primary = classical_res if classical_res["is_feasible"] else qaoa_res

    return {
        "solver": "compare",
        "solver_name": "Classical MILP vs Quantum QAOA Benchmark",
        "is_feasible": classical_res["is_feasible"] or qaoa_res["is_feasible"],
        "status_message": f"Comparison completed. Classical cost: ₹{c_cost}, QAOA cost: ₹{q_cost}",
        "schedule": primary.get("schedule", []),
        "summary": primary.get("summary", {}),
        "validation": primary.get("validation", {}),
        "execution_time_ms": round(
            (classical_res.get("execution_time_ms", 0) + qaoa_res.get("execution_time_ms", 0)), 2
        ),
        "classical": classical_res,
        "qaoa": qaoa_res,
        "comparison": comparison_summary,
    }
