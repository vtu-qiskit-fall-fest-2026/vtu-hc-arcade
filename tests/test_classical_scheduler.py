
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
RESULT_FILE = ROOT / "results" / "classical_schedule.csv"


def test_schedule_exists_and_has_six_slots():
    assert RESULT_FILE.exists()
    df = pd.read_csv(RESULT_FILE)
    assert len(df) == 6
    assert df["hour_local_solar_time"].tolist() == [7, 8, 9, 10, 11, 12]


def test_water_demand_is_met():
    df = pd.read_csv(RESULT_FILE)

    zone_a = df["running_zones"].str.contains("Zone_A").sum()
    zone_b = df["running_zones"].str.contains("Zone_B").sum()

    assert zone_a * 500 >= 1000
    assert zone_b * 500 >= 1000


def test_pump_and_grid_limits_are_respected():
    df = pd.read_csv(RESULT_FILE)

    assert (df["pump_load_kw"] <= 1.5 + 1e-6).all()
    assert (df["grid_import_kw"] >= -1e-6).all()
    assert (df["grid_import_kw"] <= 1.5 + 1e-6).all()


def test_cost_matches_grid_energy():
    df = pd.read_csv(RESULT_FILE)

    expected_cost = df["grid_import_kw"].sum() * 7.0
    actual_cost = df["grid_cost_rupees"].sum()

    assert abs(expected_cost - actual_cost) < 0.05


def test_solar_supply_is_nonnegative():
    df = pd.read_csv(RESULT_FILE)
    assert (df["estimated_pv_kw"] >= 0).all()
