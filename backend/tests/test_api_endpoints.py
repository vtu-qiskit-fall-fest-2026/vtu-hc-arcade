"""Unit and integration tests for Q-IRRIGATE Django API endpoints."""

import pytest
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestApiEndpoints:
    def test_health_endpoint(self, client):
        response = client.get("/api/health/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert "qiskit_version" in data["environment"]
        assert "Q-IRRIGATE" in data["service"]

    def test_default_scenario_endpoint(self, client):
        response = client.get("/api/scenario/default/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["defaults"]["zones"] == ["Zone_A", "Zone_B"]
        assert data["defaults"]["planning_hours"] == [7, 8, 9, 10, 11, 12]
        assert data["defaults"]["demand_litres"] == 1000.0
        assert data["defaults"]["flow_litres_per_hour"] == 500.0
        assert len(data["supported_solvers"]) >= 3

    def test_solar_profile_endpoint(self, client):
        response = client.get("/api/solar-profile/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "metadata" in data
        assert "records" in data
        assert len(data["records"]) == 24
        assert data["metadata"]["date"] == "2025-03-15"

    def test_benchmark_endpoint(self, client):
        response = client.get("/api/benchmark/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "summary" in data
        assert "trials" in data
        assert abs(data["exact_classical_cost"] - 8.2444) < 0.01

    def test_optimize_classical_valid(self, client):
        payload = {
            "zones": ["Zone_A", "Zone_B"],
            "planning_hours": [7, 8, 9, 10, 11, 12],
            "demand_litres": 1000.0,
            "flow_litres_per_hour": 500.0,
            "pump_power_kw": 1.5,
            "panel_capacity_kw": 2.0,
            "solar_performance_factor": 0.80,
            "grid_tariff_rupees_per_kwh": 7.0,
            "grid_limit_kw": 1.5,
            "max_pumps_running": 1,
            "solver": "classical",
        }
        response = client.post("/api/optimize/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["solver"] == "classical"
        assert data["is_feasible"] is True
        assert data["validation"]["passed"] is True
        assert len(data["schedule"]) == 6
        assert abs(data["summary"]["total_cost_rupees"] - 8.2444) < 0.05
        assert data["summary"]["total_water_delivered_litres"] == 2000.0

    def test_optimize_infeasible_demand(self, client):
        # Demand of 5000L with 500L/h flow requires 10 hours per zone = 20 hours
        # But only 6 slots are provided with max 1 pump!
        payload = {
            "zones": ["Zone_A", "Zone_B"],
            "planning_hours": [7, 8, 9, 10, 11, 12],
            "demand_litres": 5000.0,
            "flow_litres_per_hour": 500.0,
            "solver": "classical",
        }
        response = client.post("/api/optimize/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_feasible"] is False
        assert data["validation"]["passed"] is False
        assert "Infeasible" in data["status_message"]

    def test_optimize_invalid_solver_name(self, client):
        payload = {
            "solver": "quantum_magic_box",
        }
        response = client.post("/api/optimize/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "solver" in response.json()["details"]

    def test_optimize_negative_demand(self, client):
        payload = {
            "demand_litres": -500.0,
        }
        response = client.post("/api/optimize/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "demand_litres" in response.json()["details"]

    def test_optimize_empty_zones(self, client):
        payload = {
            "zones": [],
        }
        response = client.post("/api/optimize/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_optimize_unsupported_qaoa_multi_pump(self, client):
        payload = {
            "solver": "qaoa",
            "max_pumps_running": 2,
        }
        response = client.post("/api/optimize/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "max_pumps_running" in response.json()["details"]

    def test_optimize_history(self, client):
        # Trigger an optimization run
        client.post("/api/optimize/", {"solver": "classical"}, format="json")
        history_res = client.get("/api/history/")
        assert history_res.status_code == status.HTTP_200_OK
        data = history_res.json()
        assert data["count"] >= 1
        assert len(data["runs"]) >= 1

    def test_telemetry_get(self, client):
        response = client.get("/api/telemetry/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "active"
        assert "telemetry" in data
        assert "soil_moisture" in data["telemetry"]

    def test_telemetry_post_and_persistence(self, client):
        payload = {
            "soil_moisture": 72.5,
            "temperature": 34.2,
            "pump_status": "Running",
            "water_flow": 500.0,
            "energy_meter": 1.45,
            "device_health": 98.9,
            "solar_power": 1.35,
            "gateway_id": "GW-TEST-01",
            "zone_active": "Zone A",
        }
        post_res = client.post("/api/telemetry/", payload, format="json")
        assert post_res.status_code == status.HTTP_200_OK
        assert post_res.json()["status"] == "success"

        # Verify GET returns updated values
        get_res = client.get("/api/telemetry/")
        assert get_res.status_code == status.HTTP_200_OK
        telemetry = get_res.json()["telemetry"]
        assert telemetry["soil_moisture"] == 72.5
        assert telemetry["temperature"] == 34.2
        assert telemetry["gateway_id"] == "GW-TEST-01"
        assert telemetry["is_live_stream"] is True
