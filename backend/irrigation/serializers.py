"""Request and Response serializers for Q-IRRIGATE API."""

import math
from rest_framework import serializers
from .models import OptimizationRun


class OptimizationRequestSerializer(serializers.Serializer):
    """Validates user input for scheduling optimization."""

    zones = serializers.ListField(
        child=serializers.CharField(max_length=64),
        default=["Zone_A", "Zone_B"],
        required=False,
    )
    planning_hours = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=23),
        default=[7, 8, 9, 10, 11, 12],
        required=False,
    )
    demand_litres = serializers.FloatField(
        min_value=1.0,
        max_value=100000.0,
        default=1000.0,
        required=False,
    )
    flow_litres_per_hour = serializers.FloatField(
        min_value=1.0,
        max_value=50000.0,
        default=500.0,
        required=False,
    )
    pump_power_kw = serializers.FloatField(
        min_value=0.1,
        max_value=100.0,
        default=1.5,
        required=False,
    )
    panel_capacity_kw = serializers.FloatField(
        min_value=0.0,
        max_value=100.0,
        default=2.0,
        required=False,
    )
    solar_performance_factor = serializers.FloatField(
        min_value=0.01,
        max_value=1.0,
        default=0.80,
        required=False,
    )
    grid_tariff_rupees_per_kwh = serializers.FloatField(
        min_value=0.0,
        max_value=100.0,
        default=7.0,
        required=False,
    )
    grid_limit_kw = serializers.FloatField(
        min_value=0.1,
        max_value=100.0,
        default=1.5,
        required=False,
    )
    max_pumps_running = serializers.IntegerField(
        min_value=1,
        max_value=10,
        default=1,
        required=False,
    )
    solver = serializers.ChoiceField(
        choices=["classical", "qaoa", "compare"],
        default="classical",
        required=False,
    )
    qaoa_seed = serializers.IntegerField(
        min_value=0,
        max_value=1000000,
        default=7,
        required=False,
    )
    qaoa_reps = serializers.IntegerField(
        min_value=1,
        max_value=4,
        default=2,
        required=False,
    )
    qaoa_maxiter = serializers.IntegerField(
        min_value=10,
        max_value=500,
        default=150,
        required=False,
    )
    qubo_penalty = serializers.FloatField(
        min_value=10.0,
        max_value=100000.0,
        default=1000.0,
        required=False,
    )

    def validate_zones(self, value):
        if not value:
            raise serializers.ValidationError("At least one irrigation zone must be specified.")
        if len(value) > 8:
            raise serializers.ValidationError(
                "Up to 8 irrigation zones are supported in this demonstration prototype."
            )
        cleaned = [z.strip() for z in value if z and z.strip()]
        if len(cleaned) != len(set(cleaned)):
            raise serializers.ValidationError("Zone names must be unique.")
        return cleaned

    def validate_planning_hours(self, value):
        if not value:
            raise serializers.ValidationError("At least one planning hour must be provided.")
        unique_hours = sorted(list(set(value)))
        if len(unique_hours) != len(value):
            raise serializers.ValidationError("Planning hours must be unique.")
        return unique_hours

    def validate(self, data):
        # Validate that all numbers are strictly finite
        for key, val in data.items():
            if isinstance(val, (int, float)):
                if not math.isfinite(val):
                    raise serializers.ValidationError({key: "Value must be a finite number."})

        # Check pump limit compatibility with QAOA
        if data.get("solver") in ("qaoa", "compare") and data.get("max_pumps_running", 1) > 1:
            raise serializers.ValidationError({
                "max_pumps_running": (
                    "The current QAOA formulation supports max_pumps_running=1. "
                    "For multi-pump simultaneous operation, please select the classical solver."
                )
            })

        return data


class OptimizationRunSerializer(serializers.ModelSerializer):
    """Serializer for saved optimization runs history."""

    class Meta:
        model = OptimizationRun
        fields = [
            "id",
            "created_at",
            "solver",
            "is_feasible",
            "status_message",
            "demand_litres",
            "pump_power_kw",
            "panel_capacity_kw",
            "tariff_rupees_per_kwh",
            "total_cost_rupees",
            "total_water_delivered_litres",
            "total_grid_import_kwh",
            "total_pv_generated_kwh",
            "execution_time_ms",
            "request_payload",
            "response_payload",
        ]
