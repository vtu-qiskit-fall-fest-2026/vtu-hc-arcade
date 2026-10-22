"""URL patterns for irrigation API."""

from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check, name="api-health"),
    path("scenario/default/", views.get_default_scenario, name="api-default-scenario"),
    path("optimize/", views.optimize_schedule, name="api-optimize"),
    path("benchmark/", views.get_benchmark_report, name="api-benchmark"),
    path("solar-profile/", views.get_solar_profile, name="api-solar-profile"),
    path("history/", views.get_optimization_history, name="api-history"),
    path("telemetry/", views.telemetry_feed, name="api-telemetry"),
    path("telemetry/anomaly/", views.api_anomaly_detect, name="api-telemetry-anomaly"),
    # Auth & Role Management
    path("auth/login/", views.api_login, name="api-login"),
    path("auth/register/", views.api_register, name="api-register"),
    path("auth/users/", views.api_list_users, name="api-list-users"),
    path("auth/users/<int:user_id>/role/", views.api_update_user_role, name="api-update-user-role"),
    path("auth/users/<int:user_id>/delete/", views.api_delete_user, name="api-delete-user-alias"),
    path("auth/users/<int:user_id>/", views.api_delete_user, name="api-delete-user"),
    path("auth/forgot-password/", views.api_forgot_password, name="api-forgot-password"),
    path("auth/reset-password/", views.api_reset_password, name="api-reset-password"),
]
