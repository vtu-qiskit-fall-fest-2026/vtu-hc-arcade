
import pandas as pd
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "raw" / "nasa_power_hourly_2025.csv"
JSON_PATH = ROOT / "data" / "raw" / "nasa_power_hourly_2025.json"

df = pd.read_csv(CSV_PATH)

print("\n--- Dataset shape ---")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\n--- First 5 rows ---")
print(df.head().to_string(index=False))

print("\n--- Missing values ---")
print(df.isna().sum())

print("\n--- Duplicate timestamps ---")
print(df["timestamp"].duplicated().sum())

print("\n--- Timestamp range ---")
print("First:", df["timestamp"].min())
print("Last: ", df["timestamp"].max())

print("\n--- Numeric parameter summary ---")
print(df.drop(columns=["timestamp"]).describe().round(2))

print("\n--- Invalid or suspicious values ---")
checks = {
    "ALLSKY_SFC_SW_DWN": lambda s: (s < 0),
    "T2M": lambda s: (s < -50) | (s > 60),
    "RH2M": lambda s: (s < 0) | (s > 100),
    "PRECTOTCORR": lambda s: (s < 0),
}

for column, condition in checks.items():
    if column in df.columns:
        print(f"{column}: {int(condition(df[column]).sum())}")

print("\n--- NASA POWER parameter metadata ---")
with JSON_PATH.open("r", encoding="utf-8") as file:
    data = json.load(file)

metadata = data.get("parameters", {})
for name, details in metadata.items():
    print(
        f"{name}: units={details.get('units')}, "
        f"longname={details.get('longname')}"
    )

print("\nValidation inspection complete.")
