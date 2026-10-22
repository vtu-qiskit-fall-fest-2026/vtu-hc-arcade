# Q-IRRIGATE Benchmark Report

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
- QAOA seeds: 7, 21, 42, 84, 123

## Results

| Metric | Result |
|---|---:|
| Exact classical cost | ₹8.24 |
| Best feasible QAOA cost | ₹8.24 |
| Best QAOA seed | 7 |
| Cost gap | ₹0.00 |
| Cost gap vs classical | 0.00% |
| Feasible QAOA trials | 5/5 |

## Interpretation

The exact classical solver provides the reference optimum for this model.
QAOA produced feasible candidates, but the best observed candidate cost
₹8.24, compared with ₹8.24 for the exact solver.

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
