#!/usr/bin/env python3
"""
Table CSS Styles for HTML Documentation Coverage Report

Provides the table-specific CSS styles for the report.
"""

def get_table_styles() -> str:
    """Load and return the table CSS styles for the documentation coverage report.
    
    Returns:
        Table-specific CSS styles as string
    """
    from .template_loader import TemplateLoader
    loader = TemplateLoader()
    # Load table CSS file - this is the ONLY source of truth
    table_css = loader.load_style('table.css')
    return table_css


# Export the function
__all__ = ['get_table_styles'] 