#!/usr/bin/env python3
"""
Content Generators for HTML Documentation Coverage Report

Provides functions to generate different sections of the HTML report.
"""

from typing import Dict, List, Any
try:
    from ..models import CoverageReport, DocumentationGap
except ImportError:
    # Fallback for when running as standalone module
    from typing import Any as CoverageReport, Any as DocumentationGap

from .utils import HtmlUtils, BadgeGenerator, CssClassHelper


class ContentGenerator:
    """Generates HTML content for different report sections."""
    
    def __init__(self, config: Dict[str, Any], utils: Any = None):
        self.config = config
        self.utils = utils
        self.badge_generator = BadgeGenerator()
        self.css_helper = CssClassHelper()
        self.pr_context = None  # Will be set by PR checker if applicable
        
    def generate_header(self, report: CoverageReport) -> str:
        """Generate the report header with PR context if available."""
        # Check if this is a PR-specific report
        pr_context = getattr(self, 'pr_context', None)
        
        if pr_context and pr_context.get('is_pr_analysis'):
            pr_info = pr_context.get('pr_info', {})
            pr_files = pr_context.get('pr_files', [])
            
            pr_header = ""
            if pr_info.get('pr_number'):
                pr_header = f"""
                <div class="pr-context-banner">
                    <h2>🔄 Pull Request Analysis</h2>
                    <div class="pr-details">
                        <span class="pr-badge">PR #{pr_info.get('pr_number', 'Unknown')}</span>
                        {f'<span class="pr-title">{pr_info.get("title", "")}</span>' if pr_info.get("title") else ''}
                        {f'<span class="pr-author">by {pr_info.get("author", "Unknown")}</span>' if pr_info.get("author") else ''}
                    </div>
                    <p class="pr-scope">📁 Analyzing {len(pr_files)} changed files in this PR</p>
                </div>
                """
            
            return f"""
            <div class="header">
                <h1>📊 PR Documentation Coverage Report</h1>
                <p>Documentation coverage analysis for Pull Request changes</p>
                <p>Generated: {report.timestamp}</p>
                {pr_header}
            </div>
            """
        else:
            return f"""
            <div class="header">
                <h1>📊 Documentation Coverage Report</h1>
                <p>Comprehensive analysis of documentation coverage across the Idling.app codebase</p>
                    <p>Generated: {report.timestamp}</p>
            </div>
            """
    
    def generate_overview_cards(self, report: CoverageReport) -> str:
        """Generate overview metrics cards with filtering capabilities and PR context."""
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        
        # Check if this is a PR-specific report
        pr_context = getattr(self, 'pr_context', None)
        
        if pr_context and pr_context.get('is_pr_analysis'):
            total_pr_files = pr_context.get('total_pr_files', 0)
            analyzed_pr_files = pr_context.get('analyzed_pr_files', 0)
            
            title_suffix = f" (from {total_pr_files} changed files in PR)"
            files_label = f"PR Files Analyzed"
        else:
            title_suffix = ""
            files_label = "Total Files"
        
        return f"""
        <div class="overview-grid">
            <div class="metric-card" data-filter="all" title="Click to show all files{title_suffix}">
                <div class="metric-value">{report.total_code_files}</div>
                <div class="metric-label">{files_label}</div>
            </div>
            <div class="metric-card clickable-card" data-filter="all" title="📄 Click to show all documentation issues and reset any active filters">
                <div class="metric-value">{report.adequately_documented}</div>
                <div class="metric-label">Documented Files</div>
            </div>
            <div class="metric-card clickable-card" data-filter="all" title="📊 Click to show all documentation issues and reset any active filters">
                <div class="metric-value {self._get_coverage_class(report.coverage_percentage, min_coverage)}">{report.coverage_percentage:.1f}%</div>
                <div class="metric-label">Coverage</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {min(report.coverage_percentage, 100)}%"></div>
                </div>
            </div>
            <div class="metric-card clickable-card" data-filter="inadequate" title="⭐ Click to filter and show only files with inadequate documentation that need quality improvements">
                <div class="metric-value {self._get_quality_class(report.quality_score)}">{report.quality_score:.2f}</div>
                <div class="metric-label">Quality Score</div>
                <div class="quality-bar">
                    <div class="quality-fill" style="width: {min(report.quality_score * 100, 100)}%"></div>
                </div>
                <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">Shows files needing quality improvements</p>
            </div>
            <div class="metric-card clickable-card" data-filter="missing" title="❌ Click to filter and show only files with missing documentation">
                <div class="metric-value {self._get_status_class(report.missing_documentation == 0)}">{report.missing_documentation}</div>
                <div class="metric-label">Missing Documentation</div>
                <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">Files without any documentation</p>
            </div>
            <div class="metric-card clickable-card" data-filter="inadequate" title="⚠️ Click to filter and show only files with inadequate documentation">
                <div class="metric-value {self._get_status_class(report.inadequate_documentation == 0)}">{report.inadequate_documentation}</div>
                <div class="metric-label">Inadequate Documentation</div>
                <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">Files with incomplete documentation</p>
            </div>
        </div>
        """
    
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
        """Generate priority breakdown section with filtering capabilities."""
        if not any(count > 0 for count in report.by_priority.values()):
            return ""
        
        priority_cards = []
        priority_info = {
            "critical": {"emoji": "🚨", "desc": "Immediate action required", "color": "quality-poor"},
            "high": {"emoji": "⚠️", "desc": "Action needed soon", "color": "quality-fair"},
            "medium": {"emoji": "📝", "desc": "Should be documented", "color": "quality-good"},
            "low": {"emoji": "💡", "desc": "Nice to have", "color": "quality-excellent"}
        }
        
        for priority, count in report.by_priority.items():
            if count > 0:
                info = priority_info[priority]
                priority_cards.append(f"""
                <div class="metric-card clickable-card" data-filter="{priority}" title="Click to filter by {priority} priority">
                    <div class="metric-value {info['color']}">{count}</div>
                    <div class="metric-label">{info['emoji']} {priority.title()}</div>
                    <p style="font-size: var(--font-size-xs); margin-top: var(--spacing-xs);">{info['desc']}</p>
                </div>
                """)
        
        return f"""
        <div class="card">
            <h2>🎯 Priority Breakdown</h2>
            <div class="overview-grid">
                {''.join(priority_cards)}
            </div>
        </div>
        """
    
    def generate_gaps_analysis(self, report: CoverageReport) -> str:
        """Generate advanced gaps analysis table."""
        if not report.gaps:
            return ""
        
        # Define table columns
        columns = [
            {"id": "file", "label": "File Path", "width": "300px", "sortable": True, "visible": True, "essential": True},
            {"id": "status", "label": "Status", "width": "120px", "sortable": True, "visible": True, "essential": False},
            {"id": "priority", "label": "Priority", "width": "100px", "sortable": True, "visible": True, "essential": False},
            {"id": "expected", "label": "Expected Documentation", "width": "250px", "sortable": True, "visible": True, "essential": False},
            {"id": "effort", "label": "Effort", "width": "80px", "sortable": True, "visible": True, "essential": False},
            {"id": "issues", "label": "Quality Issues", "width": "200px", "sortable": False, "visible": True, "essential": False},
            {"id": "type", "label": "File Type", "width": "100px", "sortable": True, "visible": False, "essential": False},
            {"id": "size", "label": "Estimated Size", "width": "120px", "sortable": True, "visible": False, "essential": False}
        ]
        
        # Generate table rows
        rows = self._generate_table_rows(report.gaps)
        
        # Generate column picker options
        column_picker_html = self._generate_column_picker(columns)
        
        # Generate table headers with enhanced sort indicators
        headers_html = self._generate_table_headers(columns)
        
        return f"""
        <div class="card">
            <h2>📄 Advanced Documentation Gaps Analysis</h2>
            
            <!-- Enhanced Filter Controls -->
            <div class="advanced-filter-controls">
                <div class="filter-row">
                    <div class="search-container">
                        <input type="text" id="gap-search" placeholder="🔍 Search files, paths, or issues..." class="search-input">
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
                    <span class="filter-tag active" data-filter="all">All ({len(report.gaps)})</span>
                    <span class="filter-tag" data-filter="critical">Critical ({report.by_priority.get('critical', 0)})</span>
                    <span class="filter-tag" data-filter="high">High ({report.by_priority.get('high', 0)})</span>
                    <span class="filter-tag" data-filter="medium">Medium ({report.by_priority.get('medium', 0)})</span>
                    <span class="filter-tag" data-filter="low">Low ({report.by_priority.get('low', 0)})</span>
                    <span class="filter-tag" data-filter="missing">Missing ({report.missing_documentation})</span>
                    <span class="filter-tag" data-filter="inadequate">Inadequate ({report.inadequate_documentation})</span>
                </div>
                
                <div class="filter-status-row">
                    <span id="filter-status">Showing all {len(report.gaps)} items</span>
                    <button id="clear-filters" class="clear-btn">Clear All Filters</button>
                </div>
            </div>
            
            <!-- Pagination Controls (Top) -->
            <div class="pagination-controls pagination-top">
                <div class="pagination-info">
                    <span id="pagination-info-text">Showing 1-50 of {len(report.gaps)} items</span>
                </div>
                <div class="pagination-controls-group">
                    <label class="page-size-label">
                        Items per page:
                        <select id="page-size-select" class="page-size-select">
                            <option value="25">25</option>
                            <option value="50" selected>50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="all">All</option>
                        </select>
                    </label>
                    <div class="pagination-buttons">
                        <button id="first-page-btn" class="pagination-btn" title="First page" disabled>⏮️</button>
                        <button id="prev-page-btn" class="pagination-btn" title="Previous page" disabled>⏪</button>
                        <span id="page-indicator" class="page-indicator">Page 1 of 1</span>
                        <button id="next-page-btn" class="pagination-btn" title="Next page" disabled>⏩</button>
                        <button id="last-page-btn" class="pagination-btn" title="Last page" disabled>⏭️</button>
                    </div>
                </div>
            </div>
            
            <!-- Advanced Table Container -->
            <div class="advanced-table-container">
                <table id="gaps-table" class="advanced-table">
                    <thead>
                        <tr>
                            {headers_html}
                        </tr>
                    </thead>
                    <tbody id="table-tbody">
                        {''.join(rows)}
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination Controls (Bottom) -->
            <div class="pagination-controls pagination-bottom">
                <div class="pagination-summary">
                    <span id="pagination-summary-text">Total: {len(report.gaps)} items</span>
                </div>
                <div class="pagination-buttons">
                    <button id="first-page-btn-bottom" class="pagination-btn" title="First page" disabled>⏮️</button>
                    <button id="prev-page-btn-bottom" class="pagination-btn" title="Previous page" disabled>⏪</button>
                    <span id="page-indicator-bottom" class="page-indicator">Page 1 of 1</span>
                    <button id="next-page-btn-bottom" class="pagination-btn" title="Next page" disabled>⏩</button>
                    <button id="last-page-btn-bottom" class="pagination-btn" title="Last page" disabled>⏭️</button>
                </div>
            </div>
            
            <!-- Table Status Bar -->
            <div class="table-status-bar">
                <div class="status-info">
                    <span id="table-info">3/8 columns visible • Sorted by file. Hold Shift to multi-sort.</span>
                </div>
                <div class="sort-info">
                    <span id="sort-status">Click rows to view source code • Click filenames to open on GitHub</span>
                </div>
            </div>
            
            <!-- Column Picker Content (Hidden) -->
            <div style="display: none;">
                <div id="column-picker-content">
                    {column_picker_html}
                </div>
            </div>
        </div>
        """
    
    def _generate_table_rows(self, gaps: List[DocumentationGap]) -> List[str]:
        """Generate table rows for documentation gaps."""
        rows = []
        for gap in gaps:
            priority_badge = self._get_priority_badge(gap.priority)
            status_badge = self._get_gap_status_badge(gap.gap_type)
            
            # Get file type and estimated size
            file_type = gap.code_file.split('.')[-1].upper() if '.' in gap.code_file else 'Unknown'
            estimated_size = self._estimate_doc_size(gap.estimated_effort)
            
            # Add comprehensive data attributes
            data_attrs = f'''data-priority="{gap.priority}" 
                           data-gap-type="{gap.gap_type}" 
                           data-effort="{gap.estimated_effort}"
                           data-file-type="{file_type.lower()}"
                           data-file-name="{gap.code_file}"
                           data-expected-doc="{gap.expected_doc_path}"
                           data-issues-count="{len(gap.quality_issues)}"
                           data-github-url="{self._get_github_url(gap.code_file)}"'''
            
            quality_issues = ', '.join(gap.quality_issues[:3]) if gap.quality_issues else 'None'
            if len(gap.quality_issues) > 3:
                quality_issues += f' (+{len(gap.quality_issues) - 3} more)'
            
            # Split file path for better display
            file_parts = gap.code_file.split('/')
            file_name = file_parts[-1]
            file_dir = '/'.join(file_parts[:-1]) if len(file_parts) > 1 else ''
            
            rows.append(f"""
            <tr class="gap-row clickable-row" {data_attrs}>
                <td class="col-file" data-sort="{gap.code_file}">
                    <div class="file-path-container">
                        {f'<span class="file-directory">{file_dir}/</span>' if file_dir else ''}
                        <span class="file-name clickable-filename" 
                              data-github-url="{self._get_github_url(gap.code_file)}"
                              title="Click to open on GitHub">{file_name}</span>
                    </div>
                </td>
                <td class="col-status" data-sort="{gap.gap_type}">
                    {status_badge}
                </td>
                <td class="col-priority" data-sort="{self._get_priority_sort_value(gap.priority)}">
                    {priority_badge}
                </td>
                <td class="col-expected" data-sort="{gap.expected_doc_path}">
                    <code class="doc-path">{gap.expected_doc_path}</code>
                </td>
                <td class="col-effort" data-sort="{self._get_effort_sort_value(gap.estimated_effort)}">
                    <span class="effort-badge effort-{gap.estimated_effort.lower()}">{gap.estimated_effort.title()}</span>
                </td>
                <td class="col-issues" data-sort="{len(gap.quality_issues)}">
                    <span class="issues-text" title="{'; '.join(gap.quality_issues) if gap.quality_issues else 'No issues'}">{quality_issues}</span>
                </td>
                <td class="col-type" data-sort="{file_type}">
                    <span class="file-type-badge">{file_type}</span>
                </td>
                <td class="col-size" data-sort="{estimated_size}">
                    <span class="size-estimate">{estimated_size}</span>
                </td>
            </tr>
            """)
        
        return rows
    
    def _generate_column_picker(self, columns: List[Dict]) -> str:
        """Generate column picker HTML."""
        column_picker_html = ""
        for col in columns:
            essential_class = "essential" if col["essential"] else ""
            column_picker_html += f'''
            <label class="column-option {essential_class}">
                <input type="checkbox" 
                       data-column="{col['id']}" 
                       {"checked" if col["visible"] else ""} 
                       {"disabled" if col["essential"] else ""}>
                <span class="column-label">{col['label']}</span>
                {' <small>(essential)</small>' if col["essential"] else ''}
            </label>
            '''
        return column_picker_html
    
    def _generate_table_headers(self, columns: List[Dict]) -> str:
        """Generate table headers with enhanced sort indicators."""
        headers_html = ""
        for col in columns:
            visible_class = "" if col["visible"] else "hidden"
            sortable_class = "sortable" if col["sortable"] else ""
            headers_html += f'''
            <th class="col-{col['id']} {visible_class} {sortable_class}" 
                data-column="{col['id']}" 
                data-width="{col['width']}"
                style="width: {col['width']};">
                <div class="header-content">
                    <span class="header-text">{col['label']}</span>
                    {f'<div class="sort-indicators"></div>' if col["sortable"] else ''}
                </div>
                <div class="resize-handle"></div>
            </th>
            '''
        return headers_html
    
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
        """Generate enhanced footer with timestamp tooltips."""
        return f"""
        <div class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>📊 Report Information</h4>
                    <p>Generated by <strong>Idling.app Documentation Coverage Tool</strong></p>
                    <p>Total files analyzed: <strong>{report.total_code_files}</strong></p>
                    <p>Documentation gaps found: <strong>{len(report.gaps)}</strong></p>
                </div>
                <div class="footer-section">
                    <h4>🕒 Timestamp Information</h4>
                    <p>Generated: <span class="timestamp-with-tooltip" data-timestamp="{report.timestamp}">
                        <span class="relative-time">Loading...</span>
                    </span></p>
                    <p>Analysis completed: <span class="timestamp-with-tooltip" data-timestamp="{report.timestamp}">
                        <span class="relative-time">Loading...</span>
                    </span></p>
                </div>
                <div class="footer-section">
                    <h4>⚙️ Configuration</h4>
                    <p>Coverage threshold: <strong>{report.coverage_percentage:.1f}%</strong></p>
                    <p>Quality threshold: <strong>{report.quality_score:.1f}%</strong></p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>💡 <strong>Tip:</strong> Click on table rows to view source code, click filenames to open on GitHub</p>
                <p>⌨️ <strong>Shortcuts:</strong> Ctrl+F (Search), Ctrl+K (Columns), Ctrl+Shift+D (Theme)</p>
            </div>
        </div>
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