
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
TRIALS_FILE = ROOT / "results" / "qaoa_trials.csv"
CLASSICAL_FILE = ROOT / "results" / "classical_schedule.csv"
REPORT_FILE = ROOT / "results" / "benchmark_report.md"
SUMMARY_FILE = ROOT / "results" / "benchmark_summary.csv"


def main():
    if not TRIALS_FILE.exists():
        raise FileNotFoundError(f"Missing {TRIALS_FILE}")

    if not CLASSICAL_FILE.exists():
        raise FileNotFoundError(f"Missing {CLASSICAL_FILE}")

    trials = pd.read_csv(TRIALS_FILE)
    classical = pd.read_csv(CLASSICAL_FILE)

    feasible = trials[
        trials["feasible"].astype(str).str.lower().isin(["true", "1"])
    ].copy()

    feasible["grid_cost_rupees"] = pd.to_numeric(
        feasible["grid_cost_rupees"], errors="coerce"
    )
    feasible = feasible.dropna(subset=["grid_cost_rupees"])

    if feasible.empty:
        raise RuntimeError("No feasible QAOA trials are available.")

    classical_cost = float(classical["grid_cost_rupees"].sum())
    best = feasible.loc[feasible["grid_cost_rupees"].idxmin()]
    best_cost = float(best["grid_cost_rupees"])

    summary = pd.DataFrame([
        {"method": "Exact classical", "cost_rupees": classical_cost},
        {"method": "Best QAOA trial", "cost_rupees": best_cost},
        {"method": "Mean feasible QAOA", "cost_rupees": float(
            feasible["grid_cost_rupees"].mean()
        )},
    ])

    summary.to_csv(SUMMARY_FILE, index=False)

    gap = best_cost - classical_cost
    gap_pct = (
        100 * gap / classical_cost if classical_cost else float("nan")
    )

    report = f"""# Q-IRRIGATE Benchmark Report

## Experiment setup

- Dataset: NASA POWER-derived hourly profile for 2025-03-15
- Planning slots: 7 through 12 in the current model's time convention
- Zones: 2
- Water requirement: 1,000 litres per zone
- Pump flow: 500 litres per hour
- Pump power: 1.5 kW
- Illustrative electricity tariff: ₹7/kWh
- QAOA layers: 2
- QAOA optimizer iteration limit: 150
- QAOA seeds: {", ".join(map(str, trials["seed"].tolist()))}

## Results

| Metric | Result |
|---|---:|
| Exact classical cost | ₹{classical_cost:.2f} |
| Best feasible QAOA cost | ₹{best_cost:.2f} |
| Best QAOA seed | {int(best["seed"])} |
| Cost gap | ₹{gap:.2f} |
| Cost gap vs classical | {gap_pct:.2f}% |
| Feasible QAOA trials | {len(feasible)}/{len(trials)} |

## Interpretation

The exact classical solver provides the reference optimum for this model.
QAOA produced feasible candidates, but the best observed candidate cost
₹{best_cost:.2f}, compared with ₹{classical_cost:.2f} for the exact solver.

This experiment does not demonstrate quantum advantage.

## Limitations

- Pump, flow, panel capacity, panel performance and tariff values are
  illustrative assumptions, not measurements from a real farm.
- The solar-radiation unit interpretation and solar-to-electricity model
  require verification before physical performance claims.
- The current objective is a simplified grid-cost model.
- Only five QAOA seeds were evaluated; results are not a comprehensive
  statistical assessment.
- The schedule uses the current model's hourly time convention and should
  not be labelled IST without an explicit time conversion.
"""

    REPORT_FILE.write_text(report, encoding="utf-8")

    print("Benchmark report created:")
    print(REPORT_FILE)
    print("\nSummary CSV created:")
    print(SUMMARY_FILE)
    print("\n" + report)


if __name__ == "__main__":
    main()
