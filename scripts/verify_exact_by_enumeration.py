
from itertools import combinations
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SOLAR_FILE = ROOT / "data" / "processed" / "solar_profile_2025-03-15.csv"
CLASSICAL_FILE = ROOT / "results" / "classical_schedule.csv"
QAOA_TRIALS_FILE = ROOT / "results" / "qaoa_trials.csv"

HOURS = [7, 8, 9, 10, 11, 12]
PUMP_POWER_KW = 1.5
PANEL_CAPACITY_KW = 2.0
SOLAR_PERFORMANCE_FACTOR = 0.80
GRID_TARIFF = 7.0


def main():
    solar = pd.read_csv(SOLAR_FILE).set_index("hour")
    radiation = solar.loc[HOURS, "ALLSKY_SFC_SW_DWN"].to_numpy()

    # Retains the current provisional conversion so this verification
    # compares the same mathematical objective as the existing model.
    solar_energy = radiation / 3.6
    pv_kw = PANEL_CAPACITY_KW * solar_energy * SOLAR_PERFORMANCE_FACTOR

    slot_cost = [
     GRID_TARIFF * max(0.0, PUMP_POWER_KW - float(pv))
     for pv in pv_kw
    ]

    best_cost = float("inf")
    best_a = None
    best_b = None
    count = 0

    for zone_a in combinations(range(len(HOURS)), 2):
        remaining = [
            i for i in range(len(HOURS)) if i not in zone_a
        ]

        for zone_b in combinations(remaining, 2):
            count += 1
            cost = sum(slot_cost[i] for i in zone_a + zone_b)

            if cost < best_cost:
                best_cost = cost
                best_a = zone_a
                best_b = zone_b

    print("Independent exhaustive verification")
    print("Feasible assignments checked:", count)
    print("Optimal Zone A hours:", [HOURS[i] for i in best_a])
    print("Optimal Zone B hours:", [HOURS[i] for i in best_b])
    print(f"Minimum modeled grid cost: Rs {best_cost:.4f}")

    if CLASSICAL_FILE.exists():
        classical = pd.read_csv(CLASSICAL_FILE)
        classical_cost = classical["grid_cost_rupees"].sum()
        print(f"Classical saved schedule cost: Rs {classical_cost:.4f}")
        print(
            "Classical matches exhaustive optimum:",
            abs(classical_cost - best_cost) < 0.011,
        )

    if QAOA_TRIALS_FILE.exists():
        trials = pd.read_csv(QAOA_TRIALS_FILE)
        print("\nQAOA trial summary:")
        print(trials.to_string(index=False))

    print(
        "\nNote: this verifies the current mathematical objective only. "
        "It does not validate the physical solar model."
    )


if __name__ == "__main__":
    main()
