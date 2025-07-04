#!/usr/bin/env python3
"""
Main HTML Generator Coordinator for Documentation Coverage Report

This is a lightweight coordinator that delegates to specialized components
and uses external templates and styles instead of inline content.
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

from .template_loader import TemplateLoader
from .content_generators import ContentGenerator


class HtmlGenerator:
    """
    Lightweight HTML generator that coordinates components and templates.
    
    Uses external HTML templates and CSS files instead of inline content
    to maintain clean separation of concerns and stay under 300 lines.
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
        self.template_loader = TemplateLoader()
        self.content_generator = ContentGenerator(self.config)
        
        # Set up default content generators
        self._setup_default_generators()
    
    def _setup_default_generators(self):
        """Set up default content generation methods."""
        # These can be overridden by external code
        self._generate_header = self._default_header
        self._generate_overview_cards = self._default_overview_cards
        self._generate_quality_metrics = self._default_quality_metrics
        self._generate_priority_distribution = self._default_priority_breakdown
        self._generate_gaps_table = self._default_gaps_analysis
        self._generate_recommendations = self._default_recommendations
        self._generate_footer = self._default_footer
    
    def generate_document(self, report: CoverageReport) -> str:
        """Generate the complete HTML document.
        
        Args:
            report: Coverage report data
            
        Returns:
            Complete HTML document as string
        """
        try:
            # Generate content sections
            header = self._generate_header(report)
            overview = self._generate_overview_cards(report)
            quality = self._generate_quality_metrics(report)
            priority = self._generate_priority_distribution(report)
            gaps = self._generate_gaps_table(report)
            recommendations = self._generate_recommendations(report)
            footer = self._generate_footer(report)
            
            # Load modals template
            modals = self.template_loader.load_template('modals.html')
            
            # Render base template with all content
            html_content = self.template_loader.render_template(
                'base.html',
                header=header,
                overview=overview,
                quality=quality,
                priority=priority,
                gaps=gaps,
                recommendations=recommendations,
                footer=footer,
                modals=modals
            )
            
            # Replace external CSS/JS links with inline content for single-file output
            html_content = self._embed_assets(html_content)
            
            return html_content
            
        except Exception as e:
            return self._generate_error_page(str(e))
    
    def _embed_assets(self, html_content: str) -> str:
        """Embed external CSS and JS files inline for single-file output.
        
        Args:
            html_content: HTML content with external links
            
        Returns:
            HTML with embedded assets
        """
        # Replace CSS links with inline styles
        css_links = [
            '<link rel="stylesheet" href="styles/main.css">',
            '<link rel="stylesheet" href="styles/table.css">',
            '<link rel="stylesheet" href="styles/modals.css">'
        ]
        
        inline_styles = self.template_loader.get_inline_styles()
        
        for link in css_links:
            html_content = html_content.replace(link, '')
        
        # Insert styles in head
        html_content = html_content.replace('</head>', f'{inline_styles}\n</head>')
        
        # Replace JS links with inline scripts
        js_links = [
            '<script src="scripts/main.js"></script>'
        ]
        
        inline_scripts = self.template_loader.get_inline_scripts()
        
        for link in js_links:
            html_content = html_content.replace(link, inline_scripts)
        
        return html_content
    
    def _generate_error_page(self, error_message: str) -> str:
        """Generate an error page when something goes wrong.
        
        Args:
            error_message: Error message to display
            
        Returns:
            Error page HTML
        """
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Documentation Coverage Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .error {{ background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }}
                .error h1 {{ color: #c33; margin-top: 0; }}
            </style>
        </head>
        <body>
            <div class="error">
                <h1>❌ Error Generating Report</h1>
                <p><strong>Error:</strong> {error_message}</p>
                <p>Please check the configuration and try again.</p>
            </div>
        </body>
        </html>
        """
    
    # Default content generators (can be overridden)
    def _default_header(self, report: CoverageReport) -> str:
        """Generate default header content."""
        return self.content_generator.generate_header(report)
    
    def _default_overview_cards(self, report: CoverageReport) -> str:
        """Generate default overview cards."""
        return self.content_generator.generate_overview_cards(report)
    
    def _default_quality_metrics(self, report: CoverageReport) -> str:
        """Generate default quality metrics."""
        return self.content_generator.generate_quality_metrics(report)
    
    def _default_priority_breakdown(self, report: CoverageReport) -> str:
        """Generate default priority breakdown."""
        return self.content_generator.generate_priority_breakdown(report)
    
    def _default_gaps_analysis(self, report: CoverageReport) -> str:
        """Generate default gaps analysis."""
        return self.content_generator.generate_gaps_analysis(report)
    
    def _default_recommendations(self, report: CoverageReport) -> str:
        """Generate default recommendations."""
        return self.content_generator.generate_recommendations(report)
    
    def _default_footer(self, report: CoverageReport) -> str:
        """Generate default footer."""
        return self.content_generator.generate_footer(report)
    
    # Public methods for customization
    def set_header_generator(self, generator_func):
        """Set custom header generator function."""
        self._generate_header = generator_func
    
    def set_overview_generator(self, generator_func):
        """Set custom overview generator function."""
        self._generate_overview_cards = generator_func
    
    def set_quality_generator(self, generator_func):
        """Set custom quality metrics generator function."""
        self._generate_quality_metrics = generator_func
    
    def set_priority_generator(self, generator_func):
        """Set custom priority breakdown generator function."""
        self._generate_priority_distribution = generator_func
    
    def set_gaps_generator(self, generator_func):
        """Set custom gaps analysis generator function."""
        self._generate_gaps_table = generator_func
    
    def set_recommendations_generator(self, generator_func):
        """Set custom recommendations generator function."""
        self._generate_recommendations = generator_func
    
    def set_footer_generator(self, generator_func):
        """Set custom footer generator function."""
        self._generate_footer = generator_func 