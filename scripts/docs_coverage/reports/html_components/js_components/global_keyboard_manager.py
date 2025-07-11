#!/usr/bin/env python3
"""
Global Keyboard Manager for HTML Documentation Coverage Report

Handles application-wide keyboard shortcuts with proper OS detection and
component delegation. This is loaded before other components to ensure
global shortcuts are available.
"""

def get_global_keyboard_manager_js() -> str:
    """Load global keyboard manager JavaScript from file."""
    from pathlib import Path
    
    js_file = Path(__file__).parent.parent / 'js' / 'global-keyboard-manager.js'
    
    try:
        return js_file.read_text(encoding='utf-8')
    except FileNotFoundError:
        raise FileNotFoundError(f"Required JavaScript file not found: {js_file}")
    except Exception as e:
        raise RuntimeError(f"Failed to load global keyboard manager JavaScript: {e}") 