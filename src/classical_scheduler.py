
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import Bounds, LinearConstraint, milp
from scipy.sparse import lil_matrix


ROOT = Path(__file__).resolve().parent.parent
SOLAR_FILE = ROOT / "data" / "processed" / "solar_profile_2025-03-15.csv"
RESULTS_DIR = ROOT / "results"
RESULT_FILE = RESULTS_DIR / "classical_schedule.csv"

# Illustrative scenario assumptions
ZONES = ["Zone_A", "Zone_B"]
HOURS = [7, 8, 9, 10, 11, 12]

DEMAND_LITRES = 1000.0
FLOW_LITRES_PER_HOUR = 500.0
PUMP_POWER_KW = 1.5
MAX_PUMPS_RUNNING = 1

PANEL_CAPACITY_KW = 2.0
SOLAR_PERFORMANCE_FACTOR = 0.80
GRID_TARIFF_RUPEES_PER_KWH = 7.0
GRID_LIMIT_KW = 1.5


def main():
    if not SOLAR_FILE.exists():
        raise FileNotFoundError(
            f"Solar profile not found: {SOLAR_FILE}\n"
            "Run scripts/prepare_solar_data.py first."
        )

    solar = pd.read_csv(SOLAR_FILE)
    solar = solar[solar["hour"].isin(HOURS)].copy()
    solar = solar.set_index("hour").reindex(HOURS)

    if solar["ALLSKY_SFC_SW_DWN"].isna().any():
        raise ValueError("Missing solar data for one or more planning hours.")

    # Conditional interpretation: hourly MJ/m² values are converted
    # to kWh/m² over each one-hour interval by dividing by 3.6.
    solar_energy = (
        solar["ALLSKY_SFC_SW_DWN"].to_numpy(dtype=float) / 3.6
    )

    # Estimated PV electrical output (kW during each one-hour slot).
    # This is a simplified model, not measured panel output.
    pv_kw = (
        PANEL_CAPACITY_KW
        * solar_energy
        * SOLAR_PERFORMANCE_FACTOR
    )

    n_zones = len(ZONES)
    n_hours = len(HOURS)
    n_x = n_zones * n_hours
    n_vars = n_x + n_hours  # Binary scheduling x plus continuous grid import g.

    def x_index(zone, slot):
        return zone * n_hours + slot

    def g_index(slot):
        return n_x + slot

    objective = np.zeros(n_vars)

    # Minimize the cost of grid electricity imported in each one-hour slot.
    objective[n_x:] = GRID_TARIFF_RUPEES_PER_KWH

    lower = np.zeros(n_vars)
    upper = np.ones(n_vars)
    upper[n_x:] = GRID_LIMIT_KW
    integrality = np.zeros(n_vars, dtype=int)
    integrality[:n_x] = 1

    rows = []
    row_lower = []
    row_upper = []

    # Each zone must receive enough irrigation water.
    for zone in range(n_zones):
        row = np.zeros(n_vars)
        for slot in range(n_hours):
            row[x_index(zone, slot)] = FLOW_LITRES_PER_HOUR
        rows.append(row)
        row_lower.append(DEMAND_LITRES)
        row_upper.append(np.inf)

    # At most one pump can operate in a given hour.
    for slot in range(n_hours):
        row = np.zeros(n_vars)
        for zone in range(n_zones):
            row[x_index(zone, slot)] = 1
        rows.append(row)
        row_lower.append(-np.inf)
        row_upper.append(MAX_PUMPS_RUNNING)

    # Grid import must cover any load not supplied by solar.
    # g >= pump load - estimated PV output.
    # Since grid import has a positive cost, the optimizer will
    # choose the smallest feasible grid import.
    for slot in range(n_hours):
        row = np.zeros(n_vars)
        for zone in range(n_zones):
            row[x_index(zone, slot)] = PUMP_POWER_KW
        row[g_index(slot)] = -1

        rows.append(row)
        row_lower.append(-np.inf)
        row_upper.append(pv_kw[slot])

    matrix = lil_matrix(np.vstack(rows))

    constraints = LinearConstraint(
        matrix.tocsr(),
        np.asarray(row_lower),
        np.asarray(row_upper),
    )

    result = milp(
        c=objective,
        integrality=integrality,
        bounds=Bounds(lower, upper),
        constraints=constraints,
        options={"time_limit": 30},
    )

    if not result.success or result.x is None:
        print("Optimization did not find an optimal schedule.")
        print("Solver status:", result.message)
        return

    schedule = []
    for slot, hour in enumerate(HOURS):
        running_zones = [
            ZONES[zone]
            for zone in range(n_zones)
            if result.x[x_index(zone, slot)] > 0.5
        ]

        pump_load = PUMP_POWER_KW * len(running_zones)
        grid_import = result.x[g_index(slot)]

        schedule.append({
            "hour_local_solar_time": hour,
            "running_zones": ", ".join(running_zones) or "None",
            "estimated_pv_kw": round(pv_kw[slot], 3),
            "pump_load_kw": round(pump_load, 3),
            "grid_import_kw": round(grid_import, 3),
            "grid_cost_rupees": (
                grid_import * GRID_TARIFF_RUPEES_PER_KWH
            ),
            "water_delivered_litres": (
                len(running_zones) * FLOW_LITRES_PER_HOUR
            ),
        })

    output = pd.DataFrame(schedule)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    output.to_csv(RESULT_FILE, index=False)

    print("\nQ-IRRIGATE classical baseline")
    print("Solver:", result.message)
    print("Solar date: 2025-03-15 (NASA POWER Local Solar Time)")
    print("\nSchedule:")
    print(output.to_string(index=False))

    print("\nTotal grid energy (kWh):",
          round(output["grid_import_kw"].sum(), 3))
    print("Total grid cost (rupees):",
          round(output["grid_cost_rupees"].sum(), 2))
    print("Total water delivered (litres):",
          int(output["water_delivered_litres"].sum()))
    print("Results saved to:", RESULT_FILE)

    print("\nReminder: pump, panel, flow, tariff and performance values")
    print("are illustrative assumptions, not measured farm data.")


if __name__ == "__main__":
    main()
