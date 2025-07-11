#!/usr/bin/env python3
"""
HTML Report Generator for Documentation Coverage

Generates a comprehensive HTML report with:
- Overview statistics
- Interactive table of documentation gaps
- Source code modals
- Filtering and sorting capabilities
- Responsive design with theme support
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

from ..config import ConfigManager
from ..models import CoverageReport, DocumentationGap

# Try to import modular components
try:
    from .html_components.content_generators import ContentGenerator
    from .html_components.utils import HtmlUtils
    from .html_components.template_loader import TemplateLoader
    MODULAR_AVAILABLE = True
except ImportError:
    MODULAR_AVAILABLE = False

class HtmlReporter:
    """HTML report generator."""
    
    def __init__(self, config: ConfigManager, enable_syntax_highlighting: bool = True):
        self.config = config
        self.enable_syntax_highlighting = enable_syntax_highlighting
        self.template_loader = TemplateLoader()
        self.code_files = None  # Will be set by the checker
        self.output_file = "documentation-coverage-report.html"  # Default output file
        
        # Initialize modular components if available
        if MODULAR_AVAILABLE:
            try:
                self.content_generator = ContentGenerator(self.config.config, HtmlUtils)
                self.utils = HtmlUtils
                print("✅ Modular HTML components initialized")
            except Exception as e:
                print(f"❌ Failed to initialize modular components: {e}")
                self.content_generator = None
                self.utils = None
        else:
            self.content_generator = None
            self.utils = None
    
    def set_code_files(self, code_files: List[Any]) -> None:
        """Set the code files data for line count information."""
        self.code_files = code_files
        # Also pass to content generator if available
        if self.content_generator:
            self.content_generator.set_code_files(code_files)
    
    def set_output_file(self, output_file: str) -> None:
        """Set custom output filename."""
        self.output_file = output_file
    
    def generate(self, report: CoverageReport) -> str:
        """Generate HTML report and return the file path."""
        try:
            # Generate HTML content
            html_content = self._build_html_document(report)
            
            # Write to file using the configured output file
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            print(f"📄 HTML report generated: {self.output_file}")
            return self.output_file
            
        except Exception as e:
            print(f"❌ Failed to generate HTML report: {e}")
            raise

    def generate_html_content(self, report: CoverageReport) -> str:
        """Generate HTML content and return it directly (without writing to file)."""
        try:
            # Generate HTML content
            html_content = self._build_html_document(report)
            return html_content
            
        except Exception as e:
            print(f"❌ Failed to generate HTML content: {e}")
            raise

    def _build_html_document(self, report: CoverageReport) -> str:
        """Build the complete HTML document - MATCHES OLD WORKING VERSION."""
        
        # Use the fixed HtmlGenerator to produce the exact same output as old script
        try:
            # Initialize the HtmlGenerator with the correct config
            from .html_components.html_generator import HtmlGenerator
            html_generator = HtmlGenerator(self.config)
            
            # Pass code_files data to the HTML generator if available
            if self.code_files:
                html_generator.set_code_files(self.code_files)
            
            # Generate the complete HTML document exactly like the old script
            html_content = html_generator.generate_document(report)
            
            return html_content
            
        except Exception as e:
            print(f"❌ Failed to use HtmlGenerator: {e}")
            # Fallback to simple inline generation
            return self._generate_simple_fallback_html(report)
    
    def _generate_simple_fallback_html(self, report: CoverageReport) -> str:
        """Generate simple fallback HTML if HtmlGenerator fails."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation Coverage Report - {report.timestamp}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .error {{ background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }}
        .error h1 {{ color: #c33; margin-top: 0; }}
    </style>
</head>
<body>
    <div class="error">
        <h1>❌ Error Generating Report</h1>
        <p>Failed to generate the complete HTML report. This is a fallback view.</p>
        <p><strong>Total Files:</strong> {report.total_code_files}</p>
        <p><strong>Coverage:</strong> {report.coverage_percentage:.1f}%</p>
        <p><strong>Quality Score:</strong> {report.quality_score:.2f}</p>
        <p><strong>Gaps:</strong> {len(report.gaps)}</p>
    </div>
</body>
</html>"""

    def _generate_simple_header(self, report: CoverageReport) -> str:
        """Generate simple header fallback."""
        return f"""
        <div class="header">
            <h1>📚 Documentation Coverage Report</h1>
            <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        """

    def _generate_simple_overview(self, report: CoverageReport) -> str:
        """Generate simple overview fallback."""
        return f"""
        <div class="card">
            <h2>📊 Overview</h2>
            <div class="overview-grid">
                <div class="metric-card">
                    <div class="metric-value">{report.total_code_files}</div>
                    <div class="metric-label">Total Files</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{report.adequately_documented}</div>
                    <div class="metric-label">Documented</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{report.coverage_percentage:.1f}%</div>
                    <div class="metric-label">Coverage</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{report.quality_score:.2f}</div>
                    <div class="metric-label">Quality Score</div>
                </div>
            </div>
        </div>
        """

    def _generate_simple_table(self, report: CoverageReport) -> str:
        """Generate simple table fallback."""
        table_rows = []
        for gap in report.gaps:
            table_rows.append(f"""
                <tr class="clickable-row" data-file-path="{gap.code_file}">
                    <td class="col-file">
                        <div class="file-path-container">
                            <span class="file-directory">{os.path.dirname(gap.code_file)}/</span>
                            <span class="file-name clickable-filename">{os.path.basename(gap.code_file)}</span>
                        </div>
                    </td>
                    <td class="col-status">
                        <span class="badge badge-{gap.gap_type.lower()}">{gap.gap_type}</span>
                    </td>
                    <td class="col-priority">
                        <span class="badge badge-{gap.priority.lower()}">{gap.priority.title()}</span>
                    </td>
                    <td class="col-effort">
                        <span class="effort-badge effort-{gap.estimated_effort.lower()}">{gap.estimated_effort}</span>
                    </td>
                    <td class="col-expected">{gap.expected_doc_path}</td>
                    <td class="col-sections">{', '.join(gap.required_sections)}</td>
                    <td class="col-issues">{', '.join(gap.quality_issues)}</td>
                </tr>
            """)
        
        return f"""
        <div class="card">
            <h2>📋 Documentation Gaps</h2>
            <div class="advanced-table-container">
                <table class="advanced-table">
                    <thead>
                        <tr>
                            <th class="col-file sortable">File Path</th>
                            <th class="col-status sortable">Gap Type</th>
                            <th class="col-priority sortable">Priority</th>
                            <th class="col-effort sortable">Effort</th>
                            <th class="col-expected sortable">Expected Documentation</th>
                            <th class="col-sections sortable">Required Sections</th>
                            <th class="col-issues sortable">Quality Issues</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join(table_rows)}
                    </tbody>
                </table>
            </div>
        </div>
        """

    def _generate_simple_footer(self, report: CoverageReport) -> str:
        """Generate simple footer fallback."""
        return f"""
        <div class="footer">
            <p><strong>Idling.app</strong> - Documentation Coverage Analysis</p>
            <p>Generated by the <a href="https://idling.app" target="_blank">Idling.app</a> documentation coverage tool</p>
        </div>
        """

    def _generate_fallback_modal(self) -> str:
        """Generate fallback modal when template loading fails."""
        return """
        <div id="source-code-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title">Source Code</h3>
                    <span class="close" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div id="modal-code-content"></div>
                </div>
            </div>
        </div>
        """ 