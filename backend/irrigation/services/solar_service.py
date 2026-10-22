"""Solar data loading and PV generation modeling service."""

from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from django.conf import settings

# Path resolution: find data directory relative to repository root
REPO_ROOT = getattr(settings, "REPO_ROOT", Path(__file__).resolve().parent.parent.parent.parent)
SOLAR_FILE = REPO_ROOT / "data" / "processed" / "solar_profile_2025-03-15.csv"

SOLAR_METADATA = {
    "date": "2025-03-15",
    "location": "Solar Agri-Tech Field Station",
    "source": "NASA POWER Hourly Weather & Solar Radiation",
    "time_convention": "NASA POWER Local Solar Time (LST) — Not Indian Standard Time (IST)",
    "radiation_unit": "MJ/m^2 (accumulated hourly)",
    "conversion_to_kwh": "Divided by 3.6 (1 kWh = 3.6 MJ)",
    "pv_model_status": "Provisional model (panel_capacity * solar_energy_kwh_m2 * performance_factor)",
    "disclaimer": (
        "These are NASA-derived weather/solar observations, not measured electrical output "
        "from a farm's physical solar panels. The time convention represents Local Solar Time."
    ),
}


def get_solar_profile_df() -> pd.DataFrame:
    """Load and return the processed solar profile DataFrame."""
    if not SOLAR_FILE.exists():
        raise FileNotFoundError(
            f"Solar profile file not found at: {SOLAR_FILE}. "
            "Please ensure data/processed/solar_profile_2025-03-15.csv exists."
        )
    return pd.read_csv(SOLAR_FILE)


def get_solar_metadata() -> Dict:
    """Return descriptive metadata and scientific disclaimers for the solar dataset."""
    return SOLAR_METADATA.copy()


def get_solar_profile_records() -> List[Dict]:
    """Return all 24 hourly records from the processed solar profile."""
    df = get_solar_profile_df()
    records = []
    for _, row in df.iterrows():
        records.append({
            "hour": int(row["hour"]),
            "timestamp": str(row["timestamp"]),
            "allsky_sfc_sw_dwn": float(row["ALLSKY_SFC_SW_DWN"]),
            "solar_energy_kwh_m2": round(float(row.get("solar_energy_kwh_m2", row["ALLSKY_SFC_SW_DWN"] / 3.6)), 4),
            "temperature_c": float(row.get("temperature_c", 0.0)),
            "relative_humidity_pct": float(row.get("relative_humidity_pct", 0.0)),
            "precipitation_mm": float(row.get("precipitation_mm", 0.0)),
        })
    return records


def compute_pv_generation(
    hours: List[int],
    panel_capacity_kw: float,
    performance_factor: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute estimated hourly PV electrical generation (kW) for requested planning hours.
    
    Returns:
        (pv_kw, solar_energy_kwh_m2) as numpy arrays.
    """
    df = get_solar_profile_df()
    available_hours = df["hour"].tolist()

    missing = [h for h in hours if h not in available_hours]
    if missing:
        raise ValueError(f"Planning hours {missing} not found in solar profile (available: 0-23).")

    sub_df = df.set_index("hour").reindex(hours)

    if sub_df["ALLSKY_SFC_SW_DWN"].isna().any():
        raise ValueError("Missing solar radiation data for one or more requested planning hours.")

    radiation = sub_df["ALLSKY_SFC_SW_DWN"].to_numpy(dtype=float)

    if not np.isfinite(radiation).all() or (radiation < 0).any():
        raise ValueError("Solar radiation data contains non-finite or negative values.")

    # 1 kWh = 3.6 MJ
    solar_energy_kwh_m2 = radiation / 3.6
    pv_kw = panel_capacity_kw * solar_energy_kwh_m2 * performance_factor

    return pv_kw, solar_energy_kwh_m2
