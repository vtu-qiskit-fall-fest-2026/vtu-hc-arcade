@echo off
title Q-IRRIGATE — Edge Telemetry Gateway Launcher
echo =====================================================================
echo  Q-IRRIGATE: IoT Edge Telemetry Gateway Station
echo  Simulates real-world soil, temperature, pump, and flow telemetry.
echo =====================================================================
echo.

IF EXIST "edge_gateway\dist\q_irrigate_gateway.exe" (
    echo Starting standalone executable: edge_gateway\dist\q_irrigate_gateway.exe ...
    start "" "edge_gateway\dist\q_irrigate_gateway.exe"
) ELSE (
    echo Launching Python Edge Gateway script...
    start "" ".venv\Scripts\python.exe" "edge_gateway\q_irrigate_gateway.py"
)

echo Gateway started! Connect to your Q-IRRIGATE web dashboard at http://localhost:3000/monitoring
echo.
