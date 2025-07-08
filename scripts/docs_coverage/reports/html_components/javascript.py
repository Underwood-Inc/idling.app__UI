#!/usr/bin/env python3
"""
JavaScript functionality for HTML Documentation Coverage Report

Generates the simple JavaScript for filtering - MATCHES OLD WORKING VERSION.
"""

from .content_generators import ContentGenerator


def get_javascript() -> str:
    """Generate simple JavaScript for filtering - MATCHES OLD WORKING VERSION."""
    # Create a content generator to get the simple JavaScript
    generator = ContentGenerator({})
    return generator.generate_simple_javascript()


# Export the main function for backward compatibility
__all__ = ['get_javascript'] 