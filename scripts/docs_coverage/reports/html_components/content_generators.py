#!/usr/bin/env python3
"""
Content Generators for HTML Documentation Coverage Report

Provides functions to generate different sections of the HTML report.
"""

import json
import os
import base64
from typing import Dict, List, Any
try:
    from ...models import CoverageReport, DocumentationGap
except ImportError:
    # Fallback for when running as standalone module
    from typing import Any as CoverageReport, Any as DocumentationGap

from .utils import HtmlUtils, BadgeGenerator, CssClassHelper


class ContentGenerator:
    """Generates HTML content for different report sections."""
    
    def __init__(self, config: Dict[str, Any], utils: Any = None):
        self.config = config
        self.utils = utils or HtmlUtils
        self.badge_generator = BadgeGenerator()
        self.css_helper = CssClassHelper()
        self.pr_context = None  # Will be set by PR checker if applicable
        self.code_files = None  # Will be set by the HTML reporter
        
    def set_code_files(self, code_files: List[Any]) -> None:
        """Set the code files data for line count information."""
        self.code_files = code_files
        
    def _get_line_count_for_file(self, file_path: str) -> int:
        """Get line count for a file from the code_files data."""
        if not self.code_files:
            # Fallback: read line count directly from file system
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return len(f.readlines())
            except:
                return 0
            
        for code_file in self.code_files:
            if code_file.path == file_path:
                return code_file.size_lines
                
        # Fallback: read line count directly from file system
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return len(f.readlines())
        except:
            return 0
        
    def generate_header(self, report: CoverageReport) -> str:
        """Generate beautiful header with golden branding."""
        return f"""
        <div class="header">
            <h1>📊 Documentation Coverage Report</h1>
            <p>Comprehensive analysis of documentation coverage across the Idling.app codebase</p>
            <p>Generated: {report.timestamp}</p>
        </div>"""
    
    def generate_overview_cards(self, report: CoverageReport) -> str:
        """Generate beautiful overview dashboard with golden theme."""
        min_coverage = self.config.get("documentation_standards", {}).get("minimum_coverage_percentage", 85.0)
        
        # Determine status classes based on thresholds
        coverage_status = "quality-excellent" if report.coverage_percentage >= min_coverage else "quality-poor"
        quality_status = "quality-excellent" if report.quality_score >= 0.8 else "quality-good" if report.quality_score >= 0.6 else "quality-poor"
        
        return f"""
        <div class="overview-grid">
            <div class="metric-card" data-metric="total-files">
                <div class="metric-value">{report.total_code_files}</div>
                <div class="metric-label">TOTAL FILES</div>
            </div>
            <div class="metric-card" data-metric="documented-files">
                <div class="metric-value">{report.adequately_documented}</div>
                <div class="metric-label">DOCUMENTED FILES</div>
            </div>
            <div class="metric-card" data-metric="coverage">
                <div class="metric-value {coverage_status}">{report.coverage_percentage:.1f}%</div>
                <div class="metric-label">COVERAGE</div>
            </div>
            <div class="metric-card" data-metric="quality">
                <div class="metric-value {quality_status}">{report.quality_score:.2f}</div>
                <div class="metric-label">QUALITY SCORE</div>
                <div class="metric-subtitle">Shows files needing quality improvements</div>
            </div>
        </div>
        
        <!-- Second row with missing/inadequate documentation -->
        <div class="overview-grid">
            <div class="metric-card" data-metric="missing">
                <div class="metric-value quality-poor">{report.missing_documentation}</div>
                <div class="metric-label">MISSING DOCUMENTATION</div>
                <div class="metric-subtitle">Files without any documentation</div>
            </div>
            <div class="metric-card" data-metric="inadequate">
                <div class="metric-value quality-fair">{report.inadequate_documentation}</div>
                <div class="metric-label">INADEQUATE DOCUMENTATION</div>
                <div class="metric-subtitle">Files with incomplete documentation</div>
            </div>
        </div>"""
    
    def generate_quality_metrics(self, report: CoverageReport) -> str:
        """Generate quality metrics section."""
        return f"""
        <div class="card">
            <h2>📈 Quality Metrics</h2>
            <div class="overview-grid">
                <div class="metric-card clickable-card" data-filter="missing" title="Click to show missing documentation">
                    <div class="metric-value {self._get_status_class(report.missing_documentation == 0)}">{report.missing_documentation}</div>
                    <div class="metric-label">Missing Documentation</div>
                </div>
                <div class="metric-card clickable-card" data-filter="inadequate" title="Click to show inadequate documentation">
                    <div class="metric-value {self._get_status_class(report.inadequate_documentation == 0)}">{report.inadequate_documentation}</div>
                    <div class="metric-label">Inadequate Documentation</div>
                </div>
                <div class="metric-card clickable-card" data-filter="all" title="Click to show all issues">
                    <div class="metric-value quality-good">{len(report.gaps)}</div>
                    <div class="metric-label">Total Issues</div>
                </div>
            </div>
        </div>
        """
    
    def generate_priority_breakdown(self, report: CoverageReport) -> str:
        """Generate priority breakdown using CORRECT metric-card classes."""
        if not any(count > 0 for count in report.by_priority.values()):
            return ""
        
        priority_cards = []
        priority_info = {
            "critical": {"emoji": "🚨", "desc": "Immediate action required", "class": "quality-poor"},
            "high": {"emoji": "⚠️", "desc": "Action needed soon", "class": "quality-fair"},
            "medium": {"emoji": "📝", "desc": "Should be documented", "class": "quality-good"},
            "low": {"emoji": "💡", "desc": "Nice to have", "class": "quality-excellent"}
        }
        
        for priority, count in report.by_priority.items():
            if count > 0:
                info = priority_info[priority]
                priority_cards.append(f"""
                <div class="metric-card clickable-card" data-filter="{priority}" title="{info['emoji']} Click to filter and show only {priority} priority items - {info['desc']}">
                    <div class="metric-value {info['class']}">{count}</div>
                    <div class="metric-label">{info['emoji']} {priority.title()}</div>
                    <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">{info['desc']}</p>
                </div>""")
        
        return f"""
        <div class="card">
            <h2>🎯 Priority Breakdown</h2>
            <div class="overview-grid">
                {''.join(priority_cards)}
            </div>
        </div>"""
    
    def generate_gaps_analysis(self, report: CoverageReport) -> str:
        """Generate ADVANCED gaps analysis with search, column picker, and pagination."""
        if not report.gaps:
            return ""
        
        # Generate advanced table rows with full data
        table_rows = []
        for i, gap in enumerate(report.gaps):
            file_name = gap.code_file.split("/")[-1]
            file_dir = "/".join(gap.code_file.split("/")[:-1])
            doc_name = gap.expected_doc_path.split("/")[-1]
            issues = ", ".join(gap.quality_issues[:3])
            if len(gap.quality_issues) > 3:
                issues += f" +{len(gap.quality_issues) - 3} more"
            
            priority_emoji = {"critical": "🚨", "high": "⚠️", "medium": "📝", "low": "💡"}[gap.priority]
            
            # Generate GitHub URL
            github_url = self._get_github_url(gap.code_file)
            
            # Get file extension for better styling
            file_ext = gap.code_file.split(".")[-1] if "." in gap.code_file else "txt"
            
            # Get line count for this file
            line_count = self._get_line_count_for_file(gap.code_file)
            
            table_rows.append(f"""
                <tr class="clickable-row gap-row" data-priority="{gap.priority}" data-file-path="{gap.code_file}" 
                    data-status="{gap.gap_type}" data-effort="{gap.estimated_effort}"
                    data-file-type="{file_ext}"
                    data-file-name="{gap.code_file}"
                    data-expected-doc="{gap.expected_doc_path}"
                    data-issues-count="{len(gap.quality_issues)}"
                    data-github-url="{github_url}"
                    data-line-count="{line_count}">
                    <td class="col-file">
                        <div class="file-path-container">
                            <span class="file-directory">{file_dir}/</span>
                            <span class="file-name clickable-filename" title="Click to preview source code">{file_name}</span>
                        </div>
                    </td>
                    <td class="col-lines">
                        <span class="line-count">{line_count:,}</span>
                    </td>
                    <td class="col-status">
                        <span class="badge badge-{gap.gap_type.lower()}">{gap.gap_type.title()}</span>
                    </td>
                    <td class="col-priority">
                        <span class="priority-indicator priority-{gap.priority.lower()}">{priority_emoji} {gap.priority.title()}</span>
                    </td>
                    <td class="col-doc">
                        <span class="code">{doc_name}</span>
                    </td>
                    <td class="col-effort">
                        <span class="effort-indicator effort-{gap.estimated_effort.lower()}">{gap.estimated_effort.title()}</span>
                    </td>
                    <td class="col-issues">
                        <span class="issues-text" title="{', '.join(gap.quality_issues)}">{issues}</span>
                    </td>
                </tr>""")
        
        # Return ADVANCED HTML structure matching working report
        return f"""
        <div class="card">
            <h2>📄 Advanced Documentation Gaps Analysis</h2>
            
            <!-- Enhanced Filter Controls -->
            <div class="advanced-filter-controls">
                <div class="filter-row">
                    <div class="search-container">
                        <input type="text" id="gap-search" placeholder="🔍 Search files, paths, or issues..." class="search-input">
                        <button class="search-clear" id="search-clear" title="Clear search">✕</button>
                    </div>
                    <div class="table-controls">
                        <button id="column-picker-btn" class="control-btn" title="Show/Hide Columns">
                            <span class="btn-icon">⚙️</span>
                            <span class="btn-text">Columns</span>
                        </button>
                        <button id="reset-table-btn" class="control-btn" title="Reset Table Settings">
                            <span class="btn-icon">🔄</span>
                            <span class="btn-text">Reset</span>
                        </button>
                    </div>
                </div>
                
                <div class="filter-tags">
                    <div class="filter-group">
                        <span class="filter-label">Priority:</span>
                        <button class="filter-tag active" data-filter="priority" data-value="">All ({len(report.gaps)})</button>
                        <button class="filter-tag" data-filter="priority" data-value="critical">🚨 Critical ({len([g for g in report.gaps if g.priority == 'critical'])})</button>
                        <button class="filter-tag" data-filter="priority" data-value="high">⚠️ High ({len([g for g in report.gaps if g.priority == 'high'])})</button>
                        <button class="filter-tag" data-filter="priority" data-value="medium">📝 Medium ({len([g for g in report.gaps if g.priority == 'medium'])})</button>
                        <button class="filter-tag" data-filter="priority" data-value="low">💡 Low ({len([g for g in report.gaps if g.priority == 'low'])})</button>
                    </div>
                    <div class="filter-group">
                        <span class="filter-label">Status:</span>
                        <button class="filter-tag active" data-filter="status" data-value="">All</button>
                        <button class="filter-tag" data-filter="status" data-value="missing">❌ Missing</button>
                        <button class="filter-tag" data-filter="status" data-value="inadequate">⚠️ Inadequate</button>
                    </div>
                </div>
                
                <div class="filter-status-row">
                    <div class="results-summary">
                        <span id="filtered-count">{len(report.gaps)}</span> of <span id="total-count">{len(report.gaps)}</span> items
                    </div>
                    <button class="clear-btn" id="clear-all-filters">Clear All Filters 🧹</button>
                </div>
            </div>
            
            <!-- Advanced Table Container with Fixed Header -->
            <div class="advanced-table-container">
                <!-- Fixed Header Container -->
                <div class="advanced-table-header">
                    <table class="advanced-table">
                    <thead>
                        <tr>
                            <th class="sortable col-file" data-column="file">📁 File <span class="sort-indicator"></span></th>
                            <th class="sortable col-lines" data-column="lines">📏 Lines <span class="sort-indicator"></span></th>
                            <th class="sortable col-status" data-column="status">📊 Status <span class="sort-indicator"></span></th>
                            <th class="sortable col-priority" data-column="priority">🎯 Priority <span class="sort-indicator"></span></th>
                            <th class="sortable col-doc" data-column="doc">📄 Expected Doc <span class="sort-indicator"></span></th>
                            <th class="sortable col-effort" data-column="effort">⏱️ Effort <span class="sort-indicator"></span></th>
                            <th class="sortable col-issues" data-column="issues">⚠️ Issues <span class="sort-indicator"></span></th>
                        </tr>
                    </thead>
                    </table>
                </div>
                
                <!-- Scrollable Body Container -->
                <div class="advanced-table-body">
                    <table class="advanced-table" id="gaps-table">
                    <tbody id="gaps-table-body">
                        {''.join(table_rows)}
                    </tbody>
                </table>
                </div>
                
                <!-- Empty State View -->
                <div id="empty-state" class="empty-state" style="display: none;">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No Records Found</div>
                    <div class="empty-state-subtext">
                        <p>No documentation gaps match your current filters.</p>
                        <p>Try adjusting your search criteria or clearing filters to see more results.</p>
                        <button class="clear-btn" id="clear-filters-empty">Clear All Filters</button>
                    </div>
                </div>
            </div>
            
            <!-- Pagination Controls -->
            <div class="pagination-container">
                <div class="pagination-info">
                    <span>Showing <span id="showing-start">1</span>-<span id="showing-end">{min(50, len(report.gaps))}</span> of <span id="showing-total">{len(report.gaps)}</span> items</span>
                    <div class="items-per-page">
                        <label for="items-per-page">Items per page:</label>
                        <select id="items-per-page" class="items-select">
                            <option value="25">25</option>
                            <option value="50" selected>50</option>
                            <option value="100">100</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" id="first-page" title="First page">⏮️</button>
                    <button class="pagination-btn" id="prev-page" title="Previous page">◀️</button>
                    <span class="pagination-pages">
                        <span>Page </span>
                        <input type="number" id="current-page" value="1" min="1" max="{max(1, (len(report.gaps) + 49) // 50)}" class="page-input">
                        <span> of {max(1, (len(report.gaps) + 49) // 50)}</span>
                    </span>
                    <button class="pagination-btn" id="next-page" title="Next page">▶️</button>
                    <button class="pagination-btn" id="last-page" title="Last page">⏭️</button>
                </div>
            </div>
        </div>
        """
    
    def generate_recommendations(self, report: CoverageReport) -> str:
        """Generate recommendations section."""
        recommendations = []
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        
        # Generate recommendations based on the report
        if report.coverage_percentage < min_coverage:
            recommendations.append({
                'title': 'Low Documentation Coverage',
                'description': f'Current coverage ({report.coverage_percentage:.1f}%) is below the minimum requirement ({min_coverage}%). Focus on creating documentation for critical files.'
            })
        
        if report.quality_score < 0.7:
            recommendations.append({
                'title': 'Quality Improvement Needed',
                'description': f'Documentation quality score ({report.quality_score:.2f}) indicates room for improvement. Add missing sections and examples.'
            })
        
        if report.missing_documentation > 0:
            recommendations.append({
                'title': 'Missing Documentation Files',
                'description': f'{report.missing_documentation} files lack documentation entirely. Prioritize creating index.md files for these.'
            })
        
        if report.inadequate_documentation > 0:
            recommendations.append({
                'title': 'Inadequate Documentation',
                'description': f'{report.inadequate_documentation} files have incomplete documentation. Review and enhance these files.'
            })
        
        if not recommendations:
            recommendations.append({
                'title': 'Excellent Coverage!',
                'description': 'Your documentation coverage meets standards. Continue maintaining this quality level.'
            })
        
        rec_html = []
        for rec in recommendations:
            rec_html.append(f"""
            <div class="recommendation">
                <h4>{rec['title']}</h4>
                <p>{rec['description']}</p>
            </div>
            """)
        
        return f"""
        <div class="card">
            <h2>💡 Recommendations</h2>
            {''.join(rec_html)}
        </div>
        """
    
    def generate_footer(self, report: CoverageReport) -> str:
        """Generate beautiful enhanced footer with golden theme and modern design."""
        min_coverage = self.config.get("documentation_standards", {}).get("minimum_coverage_percentage", 85.0)
        
        return f"""
        <div class="footer">
            <div class="footer-hero">
                <div class="footer-hero-content">
                    <h3 class="footer-title">
                        <span class="footer-icon">📊</span>
                        Documentation Coverage Analysis Complete
                    </h3>
                    <p class="footer-subtitle">
                        Powered by <strong>Idling.app Documentation Coverage Tool</strong>
                    </p>
                </div>
            </div>
            
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-section-header">
                        <h4 class="footer-section-title">📋 Report Summary</h4>
                </div>
                    <div class="footer-stats">
                        <div class="footer-stat">
                            <span class="footer-stat-value">{report.total_code_files:,}</span>
                            <span class="footer-stat-label">Total Files</span>
                        </div>
                        <div class="footer-stat">
                            <span class="footer-stat-value">{len(report.gaps):,}</span>
                            <span class="footer-stat-label">Documentation Gaps</span>
                        </div>
                        <div class="footer-stat">
                            <span class="footer-stat-value">{report.coverage_percentage:.1f}%</span>
                            <span class="footer-stat-label">Coverage</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer-section">
                    <div class="footer-section-header">
                        <h4 class="footer-section-title">🕒 Generation Info</h4>
                    </div>
                    <div class="footer-info">
                        <div class="footer-info-item">
                            <span class="footer-info-label">Generated:</span>
                            <span class="footer-info-value timestamp-with-tooltip" data-timestamp="{report.timestamp}">
                        <span class="relative-time">Loading...</span>
                            </span>
                        </div>
                        <div class="footer-info-item">
                            <span class="footer-info-label">Analysis:</span>
                            <span class="footer-info-value timestamp-with-tooltip" data-timestamp="{report.timestamp}">
                        <span class="relative-time">Loading...</span>
                            </span>
                </div>
                    </div>
                </div>
                
                <div class="footer-section">
                    <div class="footer-section-header">
                        <h4 class="footer-section-title">⚙️ Configuration</h4>
                </div>
                    <div class="footer-config">
                        <div class="footer-config-item">
                            <span class="footer-config-label">Coverage Threshold:</span>
                            <span class="footer-config-value">{min_coverage:.1f}%</span>
            </div>
                        <div class="footer-config-item">
                            <span class="footer-config-label">Quality Threshold:</span>
                            <span class="footer-config-value">{report.quality_score:.1f}</span>
            </div>
        </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <div class="footer-tips">
                    <div class="footer-tip">
                        <span class="footer-tip-icon">💡</span>
                        <span class="footer-tip-text">
                            <strong>Tip:</strong> Click on table rows to view source code, click filenames to open on GitHub
                        </span>
                            </div>
                    <div class="footer-shortcuts">
                        <span class="footer-shortcut-group">
                            <kbd class="footer-kbd">Ctrl+F</kbd>
                            <span class="footer-shortcut-desc">Search</span>
                        </span>
                        <span class="footer-shortcut-group">
                            <kbd class="footer-kbd">Ctrl+K</kbd>
                            <span class="footer-shortcut-desc">Columns</span>
                        </span>
                        <span class="footer-shortcut-group">
                            <kbd class="footer-kbd">Ctrl+Shift+D</kbd>
                            <span class="footer-shortcut-desc">Theme</span>
                        </span>
                        </div>
                </div>
            </div>
            
            <div class="footer-brand">
                <div class="footer-brand-content">
                    <span class="footer-brand-text">
                        Made with <span class="footer-heart">❤️</span> by <strong>Idling.app</strong>
                    </span>
                    <span class="footer-version">v1.0.0</span>
                    </div>
                    </div>
                </div>
        """
    
    def generate_simple_javascript(self) -> str:
        """Load modular JavaScript components for the documentation coverage report."""
        return """
        // Documentation Coverage Report - Modern Modular JavaScript
        // This loads the professional, maintainable JavaScript architecture
        
        // Import and initialize the documentation coverage application
        import { documentationCoverageApp } from './js/main.js';
        
        // Ensure the application is initialized
        documentationCoverageApp.initialize().catch(error => {
            console.error('Failed to initialize documentation coverage app:', error);
        });
        
        // Backward compatibility - provide the old function name
        window.initializeDocumentationCoverageTable = () => {
            return documentationCoverageApp.initialize();
        };
        
        console.log('📚 Documentation Coverage Report - Modular JavaScript loaded');
        """
    
    # Helper methods delegating to utils module
    def _get_priority_badge(self, priority: str) -> str:
        """Get priority badge HTML."""
        return self.utils.get_priority_badge(priority)
    
    def _get_gap_status_badge(self, gap_type: str) -> str:
        """Get gap status badge HTML."""
        return self.utils.get_gap_status_badge(gap_type)
    
    def _get_coverage_class(self, coverage_pct: float, min_coverage: float) -> str:
        """Get CSS class for coverage percentage."""
        return self.utils.get_coverage_class(coverage_pct, min_coverage)
    
    def _get_quality_class(self, quality_score: float) -> str:
        """Get CSS class for quality score."""
        return self.utils.get_quality_class(quality_score)
    
    def _get_status_class(self, is_good: bool) -> str:
        """Get CSS class for status."""
        return self.utils.get_status_class(is_good)
    
    def _estimate_doc_size(self, effort: str) -> str:
        """Estimate documentation size based on effort."""
        return self.utils.estimate_doc_size(effort)
    
    def _get_priority_sort_value(self, priority: str) -> int:
        """Get numeric sort value for priority."""
        return self.utils.get_priority_sort_value(priority)
    
    def _get_effort_sort_value(self, effort: str) -> int:
        """Get numeric sort value for effort."""
        return self.utils.get_effort_sort_value(effort)
    
    def _get_github_url(self, file_path: str) -> str:
        """Generate context-aware GitHub URL based on PR context"""
        base_url = "https://github.com/Underwood-Inc/idling.app__UI/blob"
        
        # Check if this is a PR-specific report
        pr_context = getattr(self, 'pr_context', None)
        
        if pr_context and pr_context.get('is_pr_analysis'):
            # For PR analysis, use the PR head reference
            pr_info = pr_context.get('pr_info', {})
            head_ref = pr_info.get('head_ref', 'HEAD')
            
            # Clean up the reference for GitHub URL
            if head_ref.startswith('origin/'):
                branch_name = head_ref.replace('origin/', '')
            elif head_ref == 'HEAD':
                # If HEAD, try to get the actual branch name from PR info
                # Fall back to a generic PR reference
                branch_name = f"pr-{pr_info.get('number', 'unknown')}"
            else:
                branch_name = head_ref
            
            return f"{base_url}/{branch_name}/{file_path}"
        else:
            # For master branch analysis, use master
            return f"{base_url}/master/{file_path}"
    
    def generate_source_code_embedding(self, report: CoverageReport) -> str:
        """Generate source code data for modal display - BASE64 ENCODED TO AVOID JSON ESCAPING."""
        source_code_data = {}
        
        print(f"📄 Embedding source code for {len(report.gaps)} files...")
        
        for gap in report.gaps:
            file_path = gap.code_file
            try:
                # Read the actual file content - NO TRUNCATION
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                lines = content.split('\n')
                
                # BASE64 encode the content to avoid JSON escaping issues
                encoded_content = base64.b64encode(content.encode('utf-8')).decode('ascii')
                
                # Store the source code data with base64 encoded content
                source_code_data[file_path] = {
                    'content_base64': encoded_content,  # Base64 encoded content
                    'language': self._get_language_from_extension(file_path),
                    'lines': len(lines),
                    'truncated': False
                }
                
            except Exception as e:
                # If we can't read the file, create a placeholder
                error_content = f'// Could not read file: {file_path}\n// Error: {str(e)}\n// Click "View on GitHub" to see the actual source code'
                encoded_error = base64.b64encode(error_content.encode('utf-8')).decode('ascii')
                
                source_code_data[file_path] = {
                    'content_base64': encoded_error,
                    'language': 'text',
                    'lines': 0,
                    'truncated': False
                }
        
        # Generate the JSON data embedding - no escaping issues with base64!
        json_data = json.dumps(source_code_data, indent=2)
        
        return f"""
    <script type="application/json" data-source-code="true">
{json_data}
    </script>
        """
    
    def _get_language_from_extension(self, file_path: str) -> str:
        """Get programming language from file extension."""
        ext = file_path.split('.')[-1].lower()
        
        language_map = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'html': 'html',
            'xml': 'xml',
            'json': 'json',
            'md': 'markdown',
            'yml': 'yaml',
            'yaml': 'yaml',
            'sh': 'bash',
            'bash': 'bash',
            'sql': 'sql',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'c',
            'hpp': 'cpp'
        }
        
        return language_map.get(ext, 'text')