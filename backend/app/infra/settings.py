"""
Central configuration for the Capmarket Wealth Advisor Platform.
Re-exports from backend.config for app-level imports.
"""
from backend.config import Settings, get_settings

__all__ = ["Settings", "get_settings"]
