
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = ROOT / "data" / "raw" / "nasa_power_hourly_2025.csv"
OUTPUT_DIR = ROOT / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "solar_profile_2025-03-15.csv"

TEST_DATE = "2025-03-15"
SOLAR_COLUMN = "ALLSKY_SFC_SW_DWN"


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(INPUT_FILE)

    df["timestamp"] = pd.to_datetime(
        df["timestamp"].astype(str),
        format="%Y%m%d%H",
        errors="raise",
    )

    if SOLAR_COLUMN not in df.columns:
        raise ValueError(f"Missing column: {SOLAR_COLUMN}")

    daily = df[
        df["timestamp"].dt.strftime("%Y-%m-%d") == TEST_DATE
    ].copy()

    if len(daily) != 24:
        raise ValueError(
            f"Expected 24 hourly records for {TEST_DATE}, "
            f"found {len(daily)}"
        )

    if daily[SOLAR_COLUMN].isna().any():
        raise ValueError("Solar data contains missing values.")

    if (daily[SOLAR_COLUMN] < 0).any():
        raise ValueError("Solar data contains negative values.")

    daily["hour"] = daily["timestamp"].dt.hour

    # NASA metadata reports MJ/hr for this parameter.
    # Assuming the hourly value represents MJ/m² during that hour:
    # 1 kWh = 3.6 MJ.
    # Therefore, hourly solar energy = value / 3.6 kWh/m².
    daily["solar_energy_kwh_m2"] = daily[SOLAR_COLUMN] / 3.6

    daily["temperature_c"] = daily["T2M"]
    daily["relative_humidity_pct"] = daily["RH2M"]
    daily["precipitation_mm"] = daily["PRECTOTCORR"]

    output = daily[
        [
            "timestamp",
            "hour",
            SOLAR_COLUMN,
            "solar_energy_kwh_m2",
            "temperature_c",
            "relative_humidity_pct",
            "precipitation_mm",
        ]
    ].copy()

    output.to_csv(OUTPUT_FILE, index=False)

    print("Solar profile prepared successfully.")
    print(f"Date: {TEST_DATE}")
    print(f"Hourly records: {len(output)}")
    print(f"Output: {OUTPUT_FILE}")

    print("\nSolar profile:")
    print(
        output[
            ["hour", SOLAR_COLUMN, "solar_energy_kwh_m2"]
        ].to_string(index=False)
    )

    print(
        "\nTotal daily solar energy:",
        round(output["solar_energy_kwh_m2"].sum(), 3),
        "kWh/m²/day (conditional on the unit interpretation above)",
    )


if __name__ == "__main__":
    main()
