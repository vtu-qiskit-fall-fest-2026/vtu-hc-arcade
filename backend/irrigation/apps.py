"""AppConfig for irrigation app."""

from django.apps import AppConfig


class IrrigationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "irrigation"
    verbose_name = "Q-IRRIGATE Quantum-Classical Scheduler"
