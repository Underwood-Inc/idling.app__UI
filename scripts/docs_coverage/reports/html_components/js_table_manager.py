#!/usr/bin/env python3
"""
Table Manager for HTML Documentation Coverage Report

Main orchestrator that combines all table functionality modules into a cohesive
enhanced table management system. This is the primary entry point for table operations.
"""

from .js_components.global_keyboard_manager import get_global_keyboard_manager_js
from .js_components.table_manager_core import get_table_manager_core_js
from .js_components.table_sorting import get_table_sorting_js
from .js_components.table_filtering import get_table_filtering_js
from .js_components.table_pagination import get_table_pagination_js
from .js_components.table_state_manager import get_table_state_manager_js
from .js_components.table_column_manager import get_table_column_manager_js

def get_table_manager_js() -> str:
    """
    Generate complete table manager JavaScript by combining all modular components.
    
    This function orchestrates all table functionality modules:
    - Global keyboard manager (application-wide shortcuts, OS detection)
    - Core table manager (initialization, display, events)
    - Sorting functionality (single/multi-column sorting)
    - Filtering functionality (search, filter tags, card filters)
    - Pagination functionality (page navigation, page size control)
    - State management (persistence, loading, validation)
    - Column management (visibility, width control)
    
    Returns:
        Complete JavaScript code for enhanced table management
    """
    # Combine all modular components - global keyboard manager first
    components = [
        get_global_keyboard_manager_js(),  # Must be first for global shortcuts
        get_table_manager_core_js(),
        get_table_sorting_js(),
        get_table_filtering_js(),
        get_table_pagination_js(),
        get_table_state_manager_js(),
        get_table_column_manager_js()
    ]
    
    # Join all components with proper separation
    return '\n\n'.join(components)


# Export the JavaScript generator function
__all__ = ['get_table_manager_js'] 