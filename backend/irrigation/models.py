"""Database models for Q-IRRIGATE backend."""

import uuid
from django.db import models


class OptimizationRun(models.Model):
    """Stores execution history of optimization requests."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    solver = models.CharField(max_length=32)
    is_feasible = models.BooleanField(default=False)
    status_message = models.CharField(max_length=255, default="")

    demand_litres = models.FloatField()
    pump_power_kw = models.FloatField()
    panel_capacity_kw = models.FloatField()
    tariff_rupees_per_kwh = models.FloatField()

    total_cost_rupees = models.FloatField(null=True, blank=True)
    total_water_delivered_litres = models.FloatField(null=True, blank=True)
    total_grid_import_kwh = models.FloatField(null=True, blank=True)
    total_pv_generated_kwh = models.FloatField(null=True, blank=True)
    execution_time_ms = models.FloatField(null=True, blank=True)

    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Optimization Run"
        verbose_name_plural = "Optimization Runs"

    def __str__(self):
        status = "Feasible" if self.is_feasible else "Infeasible"
        return f"{self.solver.upper()} ({status}) @ {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"


class UserProfile(models.Model):
    """Stores user profile, roles, and station telemetry authorization."""

    ROLE_CHOICES = [
        ("SUPERADMIN", "Superadmin"),
        ("FIELD_ENGINEER", "Field Engineer / Operator"),
        ("AGRONOMIST", "Agronomist / Analyst"),
        ("FARMER", "Farmer / Viewer"),
        ("PENDING", "Pending Assignment"),
    ]

    user = models.OneToOneField(
        "auth.User", on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default="PENDING")
    full_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    location = models.CharField(max_length=150, blank=True, default="Primary Farm Station")
    gateway_id = models.CharField(max_length=64, blank=True, default="GW-AGRI-01")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username} - {self.role} ({self.full_name or self.user.email})"


class PasswordResetToken(models.Model):
    """Stores single-use tokens for password resets."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "auth.User", on_delete=models.CASCADE, related_name="password_resets"
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"

    def is_expired(self):
        import datetime
        from django.utils import timezone

        return timezone.now() > self.created_at + datetime.timedelta(hours=2)

    def __str__(self):
        return f"ResetToken for {self.user.email} (used={self.is_used})"


