#!/usr/bin/env python3
"""
HTML Generator for Documentation Coverage Report

Generates the complete HTML document using external CSS files with golden branding.
"""

from typing import Dict, List, Any, Optional, Union
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

try:
    from models import CoverageReport, DocumentationGap
    from config import ConfigManager
except ImportError:
    # Fallback for when running as standalone module
    from typing import Any as CoverageReport, Any as DocumentationGap, Any as ConfigManager

from .content_generators import ContentGenerator
from .javascript import get_javascript
from .template_loader import TemplateLoader


class HtmlGenerator:
    """
    HTML generator that uses external CSS files with golden branding.
    """
    
    def __init__(self, config: Union[ConfigManager, Dict[str, Any]]):
        """Initialize the HTML generator.
        
        Args:
            config: Configuration manager or config dictionary
        """
        # Extract config properly with type checking
        if isinstance(config, dict):
            self.config = config
        elif hasattr(config, 'config'):
            self.config = config.config
        else:
            # Fallback - assume it's a config-like object
            self.config = {}
        
        # Initialize components
        self.content_generator = ContentGenerator(self.config)
        self.template_loader = TemplateLoader()
    
    def set_code_files(self, code_files: List[Any]) -> None:
        """Set the code files data for line count information."""
        self.content_generator.set_code_files(code_files)
    
    def generate_document(self, report: CoverageReport) -> str:
        """Generate the complete HTML document using external CSS files.
        
        Args:
            report: Coverage report data
            
        Returns:
            Complete HTML document as string
        """
        output = []
        
        # HTML header with external CSS files (golden branding) and highlight.js
        output.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation Coverage Report - {report.timestamp}</title>
    <!-- Highlight.js CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/vs2015.min.css">
    <style>
        {self._get_complete_css()}
    </style>
</head>
<body>
    <div class="theme-toggle">
        <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Toggle theme">
            <span class="theme-icon light-icon">☀️</span>
            <span class="theme-icon dark-icon">🌙</span>
        </button>
    </div>
    
    <div class="container">""")
        
        # Generate all content sections using the content generator
        output.append(self.content_generator.generate_header(report))
        output.append(self.content_generator.generate_overview_cards(report))
        output.append(self.content_generator.generate_quality_metrics(report))
        output.append(self.content_generator.generate_priority_breakdown(report))
        output.append(self.content_generator.generate_gaps_analysis(report))
        output.append(self.content_generator.generate_recommendations(report))
        output.append(self.content_generator.generate_footer(report))
        
        # Close container
        output.append("    </div>")
        
        # Add modals
        output.append(self._get_modals())
        
        # Add source code embedding for modal system
        output.append(self.content_generator.generate_source_code_embedding(report))
        
        # Add highlight.js JavaScript and the main application JavaScript
        output.append(f"""
    <!-- Highlight.js JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/json.min.js"></script>
    <script>
        {self._get_complete_javascript()}
    </script>""")
        
        # Close HTML
        output.append("""
</body>
</html>""")
        
        return "\n".join(output)
    
    def _get_complete_css(self) -> str:
        """Get the complete CSS with golden branding."""
        try:
            # Load all CSS files
            main_css = self.template_loader.load_style('main.css')
            table_css = self.template_loader.load_style('table.css')
            modal_css = self.template_loader.load_style('modals.css')
            
            # Load additional CSS components
            try:
                from .filter_controls import FilterControlsGenerator
                from .pagination import PaginationStyleGenerator
                filter_css = FilterControlsGenerator().generate_filter_styles()
                pagination_css = PaginationStyleGenerator().generate_pagination_styles()
            except ImportError:
                filter_css = ""
                pagination_css = ""
            
            # Combine all CSS
            return f"{main_css}\n{table_css}\n{modal_css}\n{filter_css}\n{pagination_css}"
            
        except Exception as e:
            print(f"❌ Failed to load CSS: {e}")
            # Fallback to minimal CSS
            return """
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
            .error h1 { color: #c33; margin-top: 0; }
            """
    
    def _get_modals(self) -> str:
        """Get the modals HTML with column picker configuration."""
        try:
            # Define column configurations for the table
            column_definitions = [
                {
                    "id": "file",
                    "label": "📁 File",
                    "visible": True,
                    "essential": True
                },
                {
                    "id": "lines",
                    "label": "📏 Lines",
                    "visible": True,
                    "essential": False
                },
                {
                    "id": "status",
                    "label": "📊 Status",
                    "visible": True,
                    "essential": True
                },
                {
                    "id": "priority",
                    "label": "🎯 Priority",
                    "visible": True,
                    "essential": True
                },
                {
                    "id": "doc",
                    "label": "📄 Expected Doc",
                    "visible": True,
                    "essential": False
                },
                {
                    "id": "effort",
                    "label": "⏱️ Effort",
                    "visible": True,
                    "essential": False
                },
                {
                    "id": "issues",
                    "label": "⚠️ Issues",
                    "visible": True,
                    "essential": False
                }
            ]
            
            # Try to use the modals generator with column definitions
            try:
                from .modals import ModalsGenerator
                modals_generator = ModalsGenerator(self.config)
                return modals_generator.generate_all_modals(column_definitions)
            except ImportError:
                # Fallback to template loader
                return self.template_loader.load_template('modals.html')
                
        except Exception as e:
            print(f"❌ Failed to load modals: {e}")
            return ""
    
    def _get_complete_javascript(self) -> str:
        """Get the complete JavaScript."""
        try:
            # FORCE USE OF SIMPLE JAVASCRIPT - complex system is broken
            return self.content_generator.generate_simple_javascript()
        except Exception as e:
            print(f"❌ Failed to load simple JavaScript: {e}")
            # Fallback to basic JavaScript
            return get_javascript().replace('<script>', '').replace('</script>', '') 