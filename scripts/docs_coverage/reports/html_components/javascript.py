#!/usr/bin/env python3
"""
JavaScript functionality coordinator for HTML Documentation Coverage Report

Coordinates all JavaScript components for comprehensive interactive features.
"""

from .js_main import get_complete_javascript


def get_javascript() -> str:
    """Generate comprehensive JavaScript for all interactive features."""
    return get_complete_javascript()


# Export the main function for backward compatibility
__all__ = ['get_javascript'] 