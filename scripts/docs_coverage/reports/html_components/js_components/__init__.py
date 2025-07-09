#!/usr/bin/env python3
"""
JavaScript Components for HTML Documentation Coverage Report

This package contains modular JavaScript components that are combined to create
the complete table management system. Each component is responsible for a specific
aspect of table functionality.
"""

# Import all component generators
from .global_keyboard_manager import get_global_keyboard_manager_js
from .table_manager_core import get_table_manager_core_js
from .table_sorting import get_table_sorting_js
from .table_filtering import get_table_filtering_js
from .table_pagination import get_table_pagination_js
from .table_state_manager import get_table_state_manager_js
from .table_column_manager import get_table_column_manager_js

# Export all component generators
__all__ = [
    'get_global_keyboard_manager_js',
    'get_table_manager_core_js',
    'get_table_sorting_js',
    'get_table_filtering_js',
    'get_table_pagination_js',
    'get_table_state_manager_js',
    'get_table_column_manager_js'
] 