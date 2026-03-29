"""
OpenTelemetry / Application Insights telemetry setup.
Call configure_telemetry() at startup to enable distributed tracing.
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


def configure_telemetry() -> None:
    """Wire Application Insights if connection string is configured."""
    conn_str = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING", "")
    if not conn_str:
        logger.info("telemetry_disabled: no APPLICATIONINSIGHTS_CONNECTION_STRING")
        return
    try:
        from azure.monitor.opentelemetry import configure_azure_monitor
        configure_azure_monitor(connection_string=conn_str)
        logger.info("telemetry_enabled: azure_monitor")
    except ImportError:
        logger.warning(
            "telemetry_skipped: azure-monitor-opentelemetry not installed. "
            "Run: pip install azure-monitor-opentelemetry"
        )
