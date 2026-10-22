import csv
import json
import urllib.parse
import urllib.request
from pathlib import Path

# Project root directory
ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"

# Bhawanipatna, Odisha (approximate coordinates)
LATITUDE = 20.29
LONGITUDE = 83.17

# Initial study period: full year 2025
START_DATE = "20250101"
END_DATE = "20251231"

PARAMETERS = [
    "ALLSKY_SFC_SW_DWN",  # Surface solar radiation
    "T2M",                # Temperature at 2 metres
    "RH2M",               # Relative humidity
    "PRECTOTCORR",        # Corrected precipitation
]

def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "longitude": LONGITUDE,
        "latitude": LATITUDE,
        "start": START_DATE,
        "end": END_DATE,
        "format": "JSON",
    }

    url = (
        "https://power.larc.nasa.gov/api/temporal/hourly/point?"
        + urllib.parse.urlencode(params)
    )

    print("Requesting NASA POWER hourly data...")
    print(f"Location: Bhawanipatna, Odisha")
    print(f"Period: {START_DATE} to {END_DATE}")

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Q-IRRIGATE-student-project/1.0"},
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))

    except Exception as exc:
        print(f"\nDownload failed: {exc}")
        print("Check your internet connection and try again.")
        print("If the API reports an invalid parameter or date,")
        print("share the error before changing the request.")
        return

    # Save the complete API response for traceability
    json_path = RAW_DIR / "nasa_power_hourly_2025.json"
    with json_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)

    try:
        parameter_data = data["properties"]["parameter"]
    except (KeyError, TypeError):
        print("Unexpected API response structure.")
        print("Inspect the saved JSON response before proceeding.")
        return

    if not parameter_data:
        print("The API returned no parameter data.")
        return

    # Collect timestamps from the returned parameter series
    timestamps = sorted(
        set().union(*(set(series) for series in parameter_data.values()))
    )

    if not timestamps:
        print("No hourly records were returned.")
        return

    csv_path = RAW_DIR / "nasa_power_hourly_2025.csv"

    columns = list(parameter_data.keys())

    with csv_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["timestamp"] + columns)

        for timestamp in timestamps:
            row = [timestamp]

            for column in columns:
                value = parameter_data[column].get(timestamp, "")

                # NASA POWER commonly uses -999 for missing values.
                # Preserve other values; missing values will be cleaned later.
                if value == -999 or value == "-999":
                    value = ""

                row.append(value)

            writer.writerow(row)

    print("\nDownload completed.")
    print(f"Hourly records: {len(timestamps)}")
    print(f"Parameters: {', '.join(columns)}")
    print(f"Raw JSON: {json_path}")
    print(f"Raw CSV:  {csv_path}")
    print("\nNote: These are NASA-derived weather/solar data,")
    print("not measured electrical output from a farm's solar panels.")

if __name__ == "__main__":
    main()
