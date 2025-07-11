#!/usr/bin/env python3
"""
Core Table Manager for HTML Documentation Coverage Report

Main table manager class with initialization and basic setup functionality.
This is the central component that coordinates all table operations.
"""

def get_table_manager_core_js() -> str:
    """Load core table manager JavaScript from file."""
    from pathlib import Path
    
    js_file = Path(__file__).parent.parent / 'js' / 'table-manager-core.js'
    
    try:
        return js_file.read_text(encoding='utf-8')
    except FileNotFoundError:
        raise FileNotFoundError(f"Required JavaScript file not found: {js_file}")
    except Exception as e:
        raise RuntimeError(f"Failed to load table manager core JavaScript: {e}")