"""Independent schedule validation and physics calculation service."""

from typing import Dict, List, Tuple
import numpy as np


def validate_and_build_schedule(
    assignment: Dict[Tuple[str, int], int],
    zones: List[str],
    hours: List[int],
    pv_kw: np.ndarray,
    demand_litres: float,
    flow_litres_per_hour: float,
    pump_power_kw: float,
    grid_tariff: float,
    grid_limit_kw: float = 1.5,
    max_pumps_running: int = 1,
) -> Tuple[List[Dict], Dict, Dict]:
    """
    Independently validate candidate schedule decisions against all physical and operational constraints.

    Returns:
        (schedule_rows, summary, validation_result)
    """
    errors: List[str] = []
    warnings: List[str] = []

    # 1. Check binary decisions
    for (zone, hour), val in assignment.items():
        if val not in (0, 1):
            errors.append(f"Non-binary decision variable for zone {zone} at hour {hour}: {val}")

    # 2. Check water demand per zone
    zone_metrics = {}
    total_delivered = 0.0
    for zone in zones:
        hours_active = sum(assignment.get((zone, hour), 0) for hour in hours)
        delivered = hours_active * flow_litres_per_hour
        deficit = max(0.0, demand_litres - delivered)
        total_delivered += delivered

        zone_metrics[zone] = {
            "hours_active": hours_active,
            "water_delivered_litres": round(delivered, 2),
            "demand_litres": round(demand_litres, 2),
            "deficit_litres": round(deficit, 2),
            "demand_met": deficit <= 1e-5,
        }

        if deficit > 1e-5:
            errors.append(
                f"Zone '{zone}' water requirement not satisfied: delivered {delivered:.1f} L / "
                f"required {demand_litres:.1f} L (unmet demand: {deficit:.1f} L)."
            )

    # 3. Check simultaneous pump operation & grid limits per hour
    schedule_rows: List[Dict] = []
    total_grid_import_kwh = 0.0
    total_grid_cost_rupees = 0.0
    total_pump_energy_kwh = 0.0
    total_pv_generated_kwh = float(np.sum(pv_kw))

    for idx, hour in enumerate(hours):
        running_zones = [zone for zone in zones if assignment.get((zone, hour), 0) == 1]
        active_count = len(running_zones)

        if active_count > max_pumps_running:
            errors.append(
                f"Pump limit exceeded at hour {hour}: {active_count} pumps scheduled "
                f"(max allowed: {max_pumps_running})."
            )

        slot_pv_kw = float(pv_kw[idx])
        slot_pump_load_kw = active_count * pump_power_kw
        total_pump_energy_kwh += slot_pump_load_kw  # each slot is 1 hour

        # PV is consumed by pump first; deficit imported from grid
        grid_import_kw = max(0.0, slot_pump_load_kw - slot_pv_kw)

        if grid_import_kw > grid_limit_kw + 1e-5:
            errors.append(
                f"Grid import limit exceeded at hour {hour}: requested {grid_import_kw:.3f} kW "
                f"(grid limit: {grid_limit_kw:.3f} kW)."
            )

        slot_grid_cost = grid_import_kw * grid_tariff
        total_grid_import_kwh += grid_import_kw
        total_grid_cost_rupees += slot_grid_cost

        # Water delivered in this specific slot
        slot_water_litres = active_count * flow_litres_per_hour

        schedule_rows.append({
            "hour_local_solar_time": hour,
            "running_zones": ", ".join(running_zones) if running_zones else "None",
            "active_pumps_count": active_count,
            "estimated_pv_kw": round(slot_pv_kw, 3),
            "pump_load_kw": round(slot_pump_load_kw, 3),
            "grid_import_kw": round(grid_import_kw, 3),
            "grid_cost_rupees": round(slot_grid_cost, 4),
            "water_delivered_litres": round(slot_water_litres, 2),
        })

    is_feasible = (len(errors) == 0)

    summary = {
        "is_feasible": is_feasible,
        "total_cost_rupees": round(total_grid_cost_rupees, 4),
        "total_grid_energy_kwh": round(total_grid_import_kwh, 4),
        "total_water_delivered_litres": round(total_delivered, 2),
        "total_pv_generated_kwh": round(total_pv_generated_kwh, 4),
        "total_pump_energy_kwh": round(total_pump_energy_kwh, 4),
        "zone_metrics": zone_metrics,
    }

    validation_result = {
        "passed": is_feasible,
        "errors": errors,
        "warnings": warnings,
        "status_message": (
            "All physical, demand, and operational constraints passed."
            if is_feasible
            else f"Validation failed with {len(errors)} constraint violations."
        ),
    }

    return schedule_rows, summary, validation_result
