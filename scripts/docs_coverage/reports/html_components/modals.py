#!/usr/bin/env python3
"""
Modal Components Generator for Documentation Coverage Report

Generates modal dialogs using external templates instead of inline HTML.
"""

from typing import Dict, List, Any, Optional
from .template_loader import TemplateLoader


class ModalsGenerator:
    """
    Generates modal dialogs for the HTML report.
    
    Uses external HTML templates for clean separation of concerns.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the modals generator.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.template_loader = TemplateLoader()
    
    def generate_all_modals(self, columns: Optional[List[Dict]] = None) -> str:
        """Generate all modal dialogs for the report.
        
        Args:
            columns: Optional list of column definitions for column picker
            
        Returns:
            Complete modal HTML
        """
        try:
            # Load the base modals template
            modals_html = self.template_loader.load_template('modals.html')
            
            # If columns are provided, customize the column picker
            if columns:
                modals_html = self._customize_column_picker(modals_html, columns)
            
            return modals_html
            
        except Exception as e:
            # Return basic modal structure if template loading fails
            return self._generate_fallback_modals()
    
    def _customize_column_picker(self, modals_html: str, columns: List[Dict]) -> str:
        """Customize the column picker with provided columns.
        
        Args:
            modals_html: Base modals HTML
            columns: List of column definitions
            
        Returns:
            Customized modals HTML
        """
        # Generate column picker items
        column_items = []
        for col in columns:
            essential_class = "essential" if col.get("essential", False) else ""
            essential_label = '<span class="column-essential">Essential</span>' if col.get("essential", False) else ""
            disabled = "disabled" if col.get("essential", False) else ""
            checked = "checked" if col.get("visible", True) else ""
            
            column_items.append(f"""
                <div class="column-item {essential_class}">
                    <input type="checkbox" class="column-checkbox" id="col-{col['id']}" 
                           {checked} {disabled}>
                    <label for="col-{col['id']}" class="column-label">{col['label']}</label>
                    {essential_label}
                </div>
            """)
        
        # Replace placeholder with generated items
        column_picker_content = "\n".join(column_items)
        modals_html = modals_html.replace(
            "<!-- Column picker content will be inserted here -->",
            column_picker_content
        )
        
        return modals_html
    
    def _generate_fallback_modals(self) -> str:
        """Generate basic modal structure if template loading fails.
        
        Returns:
            Basic modal HTML structure
        """
        return """
        <!-- Fallback Modal Structure -->
        <div id="source-code-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Source Code</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Source code viewer not available.</p>
                </div>
            </div>
        </div>
        """
    
    def generate_source_modal(self) -> str:
        """Generate just the source code modal.
        
        Returns:
            Source code modal HTML
        """
        try:
            # For now, return the full modals template
            # In the future, we could have separate modal templates
            return self.template_loader.load_template('modals.html')
        except Exception:
            return self._generate_fallback_modals()
    
    def generate_column_picker_modal(self, columns: List[Dict]) -> str:
        """Generate just the column picker modal.
        
        Args:
            columns: List of column definitions
            
        Returns:
            Column picker modal HTML
        """
        try:
            modals_html = self.template_loader.load_template('modals.html')
            return self._customize_column_picker(modals_html, columns)
        except Exception:
            return self._generate_fallback_modals()
    
    def generate_help_modal(self) -> str:
        """Generate just the help modal.
        
        Returns:
            Help modal HTML
        """
        try:
            return self.template_loader.load_template('modals.html')
        except Exception:
            return self._generate_fallback_modals()


# Export the main class
__all__ = ['ModalsGenerator'] 