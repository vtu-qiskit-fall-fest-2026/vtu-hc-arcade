
from pathlib import Path

import numpy as np
import pandas as pd

from qiskit.primitives import StatevectorSampler
from qiskit_algorithms import QAOA, NumPyMinimumEigensolver
from qiskit_algorithms.optimizers import COBYLA
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer


ROOT = Path(__file__).resolve().parent.parent
SOLAR_FILE = ROOT / "data" / "processed" / "solar_profile_2025-03-15.csv"
RESULTS_DIR = ROOT / "results"
RESULT_FILE = RESULTS_DIR / "quantum_schedule.csv"
TRIALS_FILE = RESULTS_DIR / "qaoa_trials.csv"

ZONES = ["Zone_A", "Zone_B"]
HOURS = [7, 8, 9, 10, 11, 12]

FLOW_LITRES_PER_HOUR = 500
DEMAND_LITRES = 1000
PUMP_POWER_KW = 1.5
PANEL_CAPACITY_KW = 2.0
SOLAR_PERFORMANCE_FACTOR = 0.80
GRID_TARIFF = 7.0

SEEDS = [7, 21, 42, 84, 123]
QAOA_REPS = 2
QAOA_MAXITER = 150
QUBO_PENALTY = 1000.0


def build_problem():
    solar = pd.read_csv(SOLAR_FILE).set_index("hour")

    solar_values = solar.loc[
        HOURS, "ALLSKY_SFC_SW_DWN"
    ].to_numpy(dtype=float)

    if not np.isfinite(solar_values).all() or (solar_values < 0).any():
        raise ValueError("Solar data contains invalid values.")

    # PROVISIONAL assumption: hourly NASA values represent MJ/m²
    # accumulated during each one-hour interval.
    # Confirm this interpretation before treating the result as
    # a physically validated PV-generation estimate.
    solar_energy_kwh_m2 = solar_values / 3.6

    pv_kw = (
        PANEL_CAPACITY_KW
        * solar_energy_kwh_m2
        * SOLAR_PERFORMANCE_FACTOR
    )

    # Estimated cost of operating one pump for one hour.
    slot_cost = GRID_TARIFF * np.maximum(
        0.0, PUMP_POWER_KW - pv_kw
    )

    problem = QuadraticProgram("q_irrigate_small")

    for zone in ZONES:
        for hour in HOURS:
            problem.binary_var(name=f"x_{zone}_{hour}")

    objective = {
        f"x_{zone}_{hour}": float(slot_cost[i])
        for zone in ZONES
        for i, hour in enumerate(HOURS)
    }
    problem.minimize(linear=objective)

    required_hours = int(
        np.ceil(DEMAND_LITRES / FLOW_LITRES_PER_HOUR)
    )

    for zone in ZONES:
        problem.linear_constraint(
            linear={f"x_{zone}_{hour}": 1 for hour in HOURS},
            sense="==",
            rhs=required_hours,
            name=f"demand_{zone}",
        )

    for hour in HOURS:
        problem.linear_constraint(
            linear={f"x_{zone}_{hour}": 1 for zone in ZONES},
            sense="<=",
            rhs=1,
            name=f"one_pump_{hour}",
        )

    return problem, pv_kw


def decode_and_validate(result, pv_kw):
    """Decode the binary decision variables and independently validate."""
    if result.x is None:
        return None, False, "Solver returned no solution."

    values = np.asarray(result.x)

    if not np.isfinite(values).all():
        return None, False, "Solution contains non-finite values."

    # Do not silently round a substantially fractional solution.
    if not np.all(np.abs(values - np.rint(values)) < 1e-5):
        return None, False, "Solution contains non-binary variable values."

    values = np.rint(values).astype(int)
    assignment = dict(
        zip(problem_variable_names(result), values)
    )

    for zone in ZONES:
        active_hours = sum(
            assignment[f"x_{zone}_{hour}"] for hour in HOURS
        )
        delivered = active_hours * FLOW_LITRES_PER_HOUR

        if delivered < DEMAND_LITRES:
            return None, False, (
                f"{zone} receives only {delivered} L; "
                f"required {DEMAND_LITRES} L."
            )

    for hour in HOURS:
        active_zones = sum(
            assignment[f"x_{zone}_{hour}"] for zone in ZONES
        )
        if active_zones > 1:
            return None, False, (
                f"More than one pump is scheduled at hour {hour}."
            )

    rows = []

    for i, hour in enumerate(HOURS):
        running = [
            zone for zone in ZONES
            if assignment[f"x_{zone}_{hour}"] == 1
        ]

        pump_load = len(running) * PUMP_POWER_KW

        # Simplified energy-balance assumption. PV is allocated
        # to the pump first; any deficit is imported from the grid.
        grid_kw = max(0.0, pump_load - pv_kw[i])

        rows.append({
            "hour_local_solar_time": hour,
            "running_zones": ", ".join(running) if running else "None",
            "estimated_pv_kw": round(float(pv_kw[i]), 3),
            "pump_load_kw": round(pump_load, 3),
            "grid_import_kw": round(grid_kw, 3),
            "grid_cost_rupees": grid_kw * GRID_TARIFF,
            "water_delivered_litres": (
                len(running) * FLOW_LITRES_PER_HOUR
            ),
        })

    schedule = pd.DataFrame(rows)
    return schedule, True, "All original scheduling constraints passed."


def problem_variable_names(result):
    # Qiskit optimization results expose their original model.
    return list(result.variables) if hasattr(result, "variables") else []


def solve_and_validate(problem, pv_kw, label, optimizer):
    result = optimizer.solve(problem)

    # Use the model's variable order for reliable decoding.
    if result.x is None:
        print(f"{label}: no solution returned.")
        return None, False, None

    values = np.asarray(result.x)
    variable_names = list(problem.variables_index.keys())

    if len(values) != len(variable_names):
        print(f"{label}: unexpected solution vector length.")
        return None, False, None

    if not np.isfinite(values).all():
        print(f"{label}: solution contains non-finite values.")
        return None, False, None

    if not np.all(np.abs(values - np.rint(values)) < 1e-5):
        print(f"{label}: solution contains fractional decisions.")
        return None, False, None

    assignment = dict(
        zip(variable_names, np.rint(values).astype(int))
    )

    # Independent checks on original constraints.
    errors = []

    for zone in ZONES:
        hours_used = sum(
            assignment[f"x_{zone}_{hour}"] for hour in HOURS
        )
        water = hours_used * FLOW_LITRES_PER_HOUR
        print(f"{label} — {zone}: {hours_used} hours, {water} L")

        if water < DEMAND_LITRES:
            errors.append(f"{zone} demand not met")

    for hour in HOURS:
        if sum(
            assignment[f"x_{zone}_{hour}"] for zone in ZONES
        ) > 1:
            errors.append(f"pump limit exceeded at hour {hour}")

    rows = []
    for i, hour in enumerate(HOURS):
        running = [
            zone for zone in ZONES
            if assignment[f"x_{zone}_{hour}"] == 1
        ]
        pump_load = len(running) * PUMP_POWER_KW
        grid_kw = max(0.0, pump_load - pv_kw[i])

        rows.append({
            "hour_local_solar_time": hour,
            "running_zones": ", ".join(running) if running else "None",
            "estimated_pv_kw": round(float(pv_kw[i]), 3),
            "pump_load_kw": round(pump_load, 3),
            "grid_import_kw": round(grid_kw, 3),
            "grid_cost_rupees": grid_kw * GRID_TARIFF,
            "water_delivered_litres": (
                len(running) * FLOW_LITRES_PER_HOUR
            ),
        })

    schedule = pd.DataFrame(rows)
    valid = not errors

    print(f"\n--- {label} ---")
    print(schedule.to_string(index=False))
    print("Constraint validation:", "PASS" if valid else "FAIL")

    if errors:
        for error in errors:
            print("  -", error)

    cost = float(schedule["grid_cost_rupees"].sum())
    print(f"Recalculated grid cost: ₹{cost:.2f}")

    return schedule, valid, cost


def main():
    if not SOLAR_FILE.exists():
        raise FileNotFoundError(
            f"Missing {SOLAR_FILE}. Run scripts/prepare_solar_data.py first."
        )

    problem, pv_kw = build_problem()

    print("Variables:", problem.get_num_vars())
    print("Constraints:", problem.get_num_linear_constraints())
    print("\nSolving exact classical reference...")

    exact_optimizer = MinimumEigenOptimizer(
        NumPyMinimumEigensolver()
    )
    exact_schedule, exact_valid, exact_cost = solve_and_validate(
        problem, pv_kw, "Exact classical", exact_optimizer
    )

    if exact_schedule is None or not exact_valid:
        raise RuntimeError("Exact classical reference failed validation.")

    trial_rows = []
    best_schedule = None
    best_cost = float("inf")
    best_seed = None

    for seed in SEEDS:
        print(f"\n{'=' * 12} QAOA trial seed {seed} {'=' * 12}")

        qaoa = QAOA(
            sampler=StatevectorSampler(seed=seed),
            optimizer=COBYLA(maxiter=QAOA_MAXITER),
            reps=QAOA_REPS,
        )

        quantum_optimizer = MinimumEigenOptimizer(
            qaoa,
            penalty=QUBO_PENALTY,
        )

        try:
            schedule, valid, cost = solve_and_validate(
                problem,
                pv_kw,
                f"QAOA seed {seed}",
                quantum_optimizer,
            )
        except Exception as exc:
            print(f"Trial failed: {type(exc).__name__}: {exc}")
            schedule, valid, cost = None, False, None

        trial_rows.append({
            "seed": seed,
            "feasible": valid,
            "grid_cost_rupees": cost,
            "status": "valid" if valid else "rejected",
        })

        if valid and schedule is not None and cost is not None:
            if cost < best_cost:
                best_cost = cost
                best_schedule = schedule.copy()
                best_seed = seed

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(trial_rows).to_csv(TRIALS_FILE, index=False)

    print("\n" + "=" * 45)
    print("FINAL BENCHMARK")
    print("=" * 45)
    print(f"Exact classical cost: ₹{exact_cost:.2f}")

    if best_schedule is None:
        print("No feasible QAOA schedule found.")
        print("No QAOA schedule was saved as the best result.")
    else:
        best_schedule.to_csv(RESULT_FILE, index=False)
        print(f"Best feasible QAOA seed: {best_seed}")
        print(f"Best feasible QAOA cost: ₹{best_cost:.2f}")
        print(f"Saved schedule: {RESULT_FILE}")
        print(f"Cost gap vs exact: ₹{best_cost - exact_cost:.2f}")

    print(f"Trial report: {TRIALS_FILE}")
    print("\nAll scenario and solar-conversion assumptions remain illustrative.")
    print("This experiment does not establish quantum advantage.")


if __name__ == "__main__":
    main()
