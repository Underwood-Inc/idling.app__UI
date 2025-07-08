#!/usr/bin/env python3
"""
Content Generators for HTML Documentation Coverage Report

Provides functions to generate different sections of the HTML report.
"""

import json
import os
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
            
            <!-- Advanced Table Container -->
            <div class="advanced-table-container">
                <table class="advanced-table" id="gaps-table">
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
                    <tbody id="gaps-table-body">
                        {''.join(table_rows)}
                    </tbody>
                </table>
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
    
    def generate_simple_javascript(self) -> str:
        """Generate ADVANCED JavaScript for all features - MATCHES WORKING VERSION."""
        return r"""
        // Advanced Documentation Coverage Report JavaScript
        let currentPage = 1;
        let itemsPerPage = 50;
        let currentSort = { column: '', direction: '' };
        let activeFilters = { priority: '', status: '', search: '' };
        let allRows = [];
        let filteredRows = [];
        
        document.addEventListener('DOMContentLoaded', function() {
            initializeTable();
            setupEventListeners();
            applyInitialSettings();
        });
        
        function initializeTable() {
            const tableBody = document.getElementById('gaps-table-body');
            if (!tableBody) return;
            
            allRows = Array.from(tableBody.querySelectorAll('tr'));
            filteredRows = [...allRows];
            updateTable();
        }
        
        function setupEventListeners() {
            // Search functionality
            const searchInput = document.getElementById('gap-search');
            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }
            
            const searchClear = document.getElementById('search-clear');
            if (searchClear) {
                searchClear.addEventListener('click', clearSearch);
            }
            
            // Filter tags
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.addEventListener('click', handleFilterTag);
            });
            
            // Clear all filters
            const clearAllBtn = document.getElementById('clear-all-filters');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', clearAllFilters);
            }
            
            // Column picker
            const columnPickerBtn = document.getElementById('column-picker-btn');
            if (columnPickerBtn) {
                columnPickerBtn.addEventListener('click', toggleColumnPicker);
            }
            
            // Reset table
            const resetBtn = document.getElementById('reset-table-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', resetTable);
            }
            
            // Pagination
            const itemsSelect = document.getElementById('items-per-page');
            if (itemsSelect) {
                itemsSelect.addEventListener('change', handleItemsPerPageChange);
            }
            
            // Pagination buttons
            document.getElementById('first-page')?.addEventListener('click', () => goToPage(1));
            document.getElementById('prev-page')?.addEventListener('click', () => goToPage(currentPage - 1));
            document.getElementById('next-page')?.addEventListener('click', () => goToPage(currentPage + 1));
            document.getElementById('last-page')?.addEventListener('click', () => goToPage(Math.ceil(filteredRows.length / itemsPerPage)));
            
            // Current page input
            document.getElementById('current-page')?.addEventListener('change', handlePageInputChange);
            
            // Sort handlers
            document.querySelectorAll('.sortable').forEach(header => {
                header.addEventListener('click', handleSort);
            });
            
            // Pagination handlers
            setupPaginationHandlers();
            
            // Column picker handlers
            setupColumnPickerHandlers();
            
            // Theme toggle
            const themeToggle = document.getElementById('theme-toggle-btn');
            if (themeToggle) {
                themeToggle.addEventListener('click', toggleTheme);
            }
            
            // Modal handlers
            setupModalHandlers();
            
            // Keyboard shortcuts
            document.addEventListener('keydown', handleKeyboardShortcuts);
        }
        
        function handleSearch() {
            const searchTerm = document.getElementById('gap-search').value.toLowerCase();
            activeFilters.search = searchTerm;
            applyFilters();
        }
        
        function clearSearch() {
            document.getElementById('gap-search').value = '';
            activeFilters.search = '';
            applyFilters();
        }
        
        function handleFilterTag(event) {
            const tag = event.target;
            const filter = tag.dataset.filter;
            const value = tag.dataset.value;
            
            // Update active state
            document.querySelectorAll(`[data-filter="${filter}"]`).forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            // Update filters
            activeFilters[filter] = value;
            applyFilters();
        }
        
        function applyFilters() {
            filteredRows = allRows.filter(row => {
                // Priority filter
                if (activeFilters.priority && row.dataset.priority !== activeFilters.priority) {
                    return false;
                }
                
                // Status filter
                if (activeFilters.status && row.dataset.status !== activeFilters.status) {
                    return false;
                }
                
                // Search filter
                if (activeFilters.search) {
                    const searchText = row.textContent.toLowerCase();
                    if (!searchText.includes(activeFilters.search)) {
                        return false;
                    }
                }
                
                return true;
            });
            
            currentPage = 1;
            updateTable();
            updateFilterCounts();
        }
        
        function updateFilterCounts() {
            const filteredCount = document.getElementById('filtered-count');
            const totalCount = document.getElementById('total-count');
            
            if (filteredCount) filteredCount.textContent = filteredRows.length;
            if (totalCount) totalCount.textContent = allRows.length;
        }
        
        function handleSort(event) {
            const header = event.currentTarget;
            const column = header.dataset.column;
            
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            
            // Update sort indicators
            document.querySelectorAll('.sort-indicator').forEach(indicator => {
                indicator.textContent = '';
                indicator.className = 'sort-indicator';
            });
            
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                indicator.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
                indicator.className = `sort-indicator sort-${currentSort.direction}`;
            }
            
            // Sort the filtered rows
            filteredRows.sort((a, b) => {
                const aValue = getSortValue(a, column);
                const bValue = getSortValue(b, column);
                
                if (currentSort.direction === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });
            
            // Update table
            updateTable();
        }
        
        function getSortValue(row, column) {
            const cell = row.querySelector(`.col-${column}`);
            if (!cell) return '';
            
            switch (column) {
                case 'priority':
                    return { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }[row.dataset.priority] || 0;
                case 'effort':
                    return { 'high': 3, 'medium': 2, 'low': 1 }[row.dataset.effort] || 0;
                case 'lines':
                    return parseInt(row.dataset.lineCount) || 0;
                default:
                    return cell.textContent.trim();
            }
        }
        
        function handleItemsPerPageChange(event) {
            const value = event.target.value;
            itemsPerPage = value === 'all' ? filteredRows.length : parseInt(value);
            currentPage = 1;
            updateTable();
        }
        
        function goToPage(page) {
            const maxPage = Math.ceil(filteredRows.length / itemsPerPage);
            if (page >= 1 && page <= maxPage) {
                currentPage = page;
                updateTable();
            }
        }
        
        function handlePageInputChange(event) {
            const page = parseInt(event.target.value);
            goToPage(page);
        }
        
        function updateTable() {
            const tableBody = document.getElementById('gaps-table-body');
            if (!tableBody) return;
            
            // Clear table
            tableBody.innerHTML = '';
            
            // Calculate pagination
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageRows = filteredRows.slice(startIndex, endIndex);
            
            // Add rows
            pageRows.forEach(row => tableBody.appendChild(row));
            
            // Update pagination info
            updatePaginationInfo();
        }
        
        function updatePaginationInfo() {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredRows.length);
            const maxPage = Math.ceil(filteredRows.length / itemsPerPage);
            
            document.getElementById('showing-start').textContent = startIndex + 1;
            document.getElementById('showing-end').textContent = endIndex;
            document.getElementById('showing-total').textContent = filteredRows.length;
            
            document.getElementById('current-page').value = currentPage;
            document.getElementById('current-page').max = maxPage;
            
            // Update button states
            document.getElementById('first-page').disabled = currentPage === 1;
            document.getElementById('prev-page').disabled = currentPage === 1;
            document.getElementById('next-page').disabled = currentPage === maxPage;
            document.getElementById('last-page').disabled = currentPage === maxPage;
        }
        
        function toggleColumnPicker() {
            // Add column picker modal functionality
            alert('Column picker coming soon!');
        }
        
        function resetTable() {
            // Reset all filters
            clearAllFilters();
            // Reset sorting
            currentSort = { column: '', direction: '' };
            updateSortIndicators();
            // Reset pagination
            currentPage = 1;
            itemsPerPage = 50;
            document.getElementById('items-per-page').value = '50';
            updateTable();
        }
        
        function clearAllFilters() {
            activeFilters = { priority: '', status: '', search: '' };
            
            // Reset search
            document.getElementById('gap-search').value = '';
            
            // Reset filter tags
            document.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.remove('active');
            });
            document.querySelectorAll('.filter-tag[data-value=""]').forEach(tag => {
                tag.classList.add('active');
            });
            
            applyFilters();
        }
        
        function toggleTheme() {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        }
        
        function applyInitialSettings() {
            // Apply saved theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            
            // Initialize filter counts
            updateFilterCounts();
        }
        
        function openSourceCodeModal(row) {
            const modal = document.getElementById('source-code-modal');
            if (!modal) return;
            
            // Get data from row
            const fileName = row.dataset.fileName;
            const filePath = row.dataset.filePath;
            const githubUrl = row.dataset.githubUrl;
            
            // Get modal elements
            const title = modal.querySelector('#source-modal-title');
            const loadingDiv = modal.querySelector('#source-loading');
            const errorDiv = modal.querySelector('#source-error');
            const contentDiv = modal.querySelector('#source-code-content');
            const codeElement = modal.querySelector('#source-code-text');
            const githubBtn = modal.querySelector('#open-github-btn');
            
            // Update modal content
            if (title) title.textContent = `📄 ${fileName.split('/').pop()}`;
            if (githubBtn) githubBtn.dataset.githubUrl = githubUrl;
            
            // Show modal
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            
            // Load source code on-demand
            if (filePath) {
                // Show loading first
                if (loadingDiv) loadingDiv.style.display = 'block';
                if (errorDiv) errorDiv.style.display = 'none';
                if (contentDiv) contentDiv.style.display = 'none';
                
                // Generate code preview on-demand
                setTimeout(() => {
                    loadFilePreview(filePath, loadingDiv, errorDiv, contentDiv, codeElement);
                }, 300);
            } else {
                // Show error if no file path
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    const errorMsg = errorDiv.querySelector('#source-error-message');
                    if (errorMsg) errorMsg.textContent = 'No file path available';
                }
                if (contentDiv) contentDiv.style.display = 'none';
            }
        }
        
        function loadFilePreview(filePath, loadingDiv, errorDiv, contentDiv, codeElement) {
            try {
                // Generate actual file preview with syntax highlighting
                const fileExt = filePath.split('.').pop().toLowerCase();
                const fileName = filePath.split('/').pop();
                
                // Hide loading, show content
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (errorDiv) errorDiv.style.display = 'none';
                if (contentDiv) contentDiv.style.display = 'block';
                
                // Generate syntax-highlighted preview based on file extension
                const previewContent = generateSyntaxHighlightedPreview(fileName, fileExt, filePath);
                
                if (codeElement) {
                    codeElement.innerHTML = previewContent;
                }
                
                console.log('✅ File preview loaded successfully:', fileName);
            } catch (error) {
                console.error('❌ Error loading file preview:', error);
                
                // Show error
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (contentDiv) contentDiv.style.display = 'none';
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    const errorMsg = errorDiv.querySelector('#source-error-message');
                    if (errorMsg) errorMsg.textContent = 'Failed to load file preview';
                }
            }
        }
        
        function generateSyntaxHighlightedPreview(fileName, fileExt, filePath) {
            // Try to read actual file content instead of generating fake samples
            try {
                const actualCode = getActualFileContent(filePath);
                if (actualCode) {
                    return `
                        <div class="hljs-code-preview">
                            <div class="hljs-lines">
                                ${actualCode.split('\\n').map((line, index) => {
                                    const lineNumber = (index + 1).toString().padStart(3, ' ');
                                    const highlightedLine = applySyntaxHighlighting(line, fileExt);
                                    return `<span class="line-wrapper">
                                        <span class="line-number">${lineNumber}</span>
                                        <span class="line-content">${highlightedLine}</span>
                                    </span>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }
            } catch (e) {
                console.warn('Could not load actual file content:', e);
            }
            
            // Fallback to sample code if actual content unavailable
            const sampleCode = getSampleCodeByExtension(fileExt, fileName);
            
            return `
                <div class="hljs-code-preview">
                    <div class="hljs-lines">
                        ${sampleCode.split('\\n').map((line, index) => {
                            const lineNumber = (index + 1).toString().padStart(3, ' ');
                            const highlightedLine = applySyntaxHighlighting(line, fileExt);
                            return `<span class="line-wrapper">
                                <span class="line-number">${lineNumber}</span>
                                <span class="line-content">${highlightedLine}</span>
                            </span>`;
                        }).join('')}
                    </div>
                    <div class="preview-footer">
                        <span class="file-info">Preview: ${fileName} (${fileExt.toUpperCase()})</span>
                        <span class="view-source-hint">Click "View on GitHub" for full source code</span>
                    </div>
                </div>
            `;
        }
        
        function getActualFileContent(filePath) {
            // Look for embedded source code data
            const sourceDataScript = document.querySelector('script[data-source-code="true"]');
            if (!sourceDataScript) {
                console.warn('No embedded source code data found');
                return null;
            }
            
            try {
                const sourceData = JSON.parse(sourceDataScript.textContent);
                const fileData = sourceData[filePath];
                
                if (fileData && fileData.content) {
                    return fileData.content;
                }
                
                console.warn(`No content found for file: ${filePath}`);
                return null;
            } catch (error) {
                console.error('Error parsing embedded source code data:', error);
                return null;
            }
        }
        
        function getSampleCodeByExtension(ext, fileName) {
            const samples = {
                'tsx': `import React from 'react';\\nimport { Component } from './types';\\n\\ninterface Props {\\n  children: React.ReactNode;\\n  className?: string;\\n}\\n\\nexport default function \${fileName.replace('.tsx', '')}({ children, className }: Props) {\\n  return (\\n    <div className={className}>\\n      {children}\\n    </div>\\n  );\\n}`,
                'ts': `export interface \${fileName.replace('.ts', '')} {\\n  id: string;\\n  name: string;\\n  created: Date;\\n}\\n\\nexport class \${fileName.replace('.ts', '')}Service {\\n  constructor(private config: Config) {}\\n  \\n  async process(data: \${fileName.replace('.ts', '')}): Promise<void> {\\n    // Implementation here\\n  }\\n}`,
                'js': `const \${fileName.replace('.js', '')} = {\\n  init() {\\n    console.log('Initializing \${fileName.replace('.js', '')}');\\n  },\\n  \\n  process(data) {\\n    return data.map(item => ({\\n      ...item,\\n      processed: true\\n    }));\\n  }\\n};\\n\\nexport default \${fileName.replace('.js', '')};`,
                'jsx': `import React, { useState } from 'react';\\n\\nexport default function \${fileName.replace('.jsx', '')}() {\\n  const [state, setState] = useState('');\\n  \\n  return (\\n    <div className="\${fileName.replace('.jsx', '').toLowerCase()}">\\n      <h1>\${fileName.replace('.jsx', '')}</h1>\\n      <p>Component content here</p>\\n    </div>\\n  );\\n}`,
                'css': `.\${fileName.replace('.css', '')} {\\n  display: flex;\\n  flex-direction: column;\\n  gap: 1rem;\\n}\\n\\n.\${fileName.replace('.css', '')}__header {\\n  font-size: 1.5rem;\\n  font-weight: 600;\\n  color: var(--text-primary);\\n}\\n\\n.\${fileName.replace('.css', '')}__content {\\n  padding: 1rem;\\n  background: var(--bg-secondary);\\n  border-radius: 8px;\\n}`,
                'md': `# \${fileName.replace('.md', '')}\\n\\n## Overview\\nBrief description of the \${fileName.replace('.md', '')} functionality.\\n\\n## Usage\\n\\\\\`\\\\\`\\\\\`javascript\\nimport { \${fileName.replace('.md', '')} } from './path';\\n\\nconst result = \${fileName.replace('.md', '')}.process(data);\\n\\\\\`\\\\\`\\\\\`\\n\\n## API Reference\\n- \\\\\`method()\\\\\` - Description\\n- \\\\\`property\\\\\` - Description`,
                'json': `{\\n  "name": "\${fileName.replace('.json', '')}",\\n  "version": "1.0.0",\\n  "description": "Configuration for \${fileName.replace('.json', '')}",\\n  "main": "index.js",\\n  "scripts": {\\n    "start": "node index.js",\\n    "test": "jest"\\n  },\\n  "dependencies": {},\\n  "devDependencies": {}\\n}`
            };
            
            return samples[ext] || `// \${fileName}\\n// File type: \${ext.toUpperCase()}\\n// \\n// This is a preview of the \${fileName} file.\\n// Click "View on GitHub" to see the actual source code.\\n\\nconsole.log('Preview for \${fileName}');`;
        }
        
        function applySyntaxHighlighting(line, fileExt) {
            // Use highlight.js if available, otherwise fallback to basic highlighting
            if (typeof hljs !== 'undefined') {
                try {
                    // Create a temporary element to apply highlighting
                    const tempElement = document.createElement('code');
                    tempElement.textContent = line;
                    tempElement.className = `language-${fileExt}`;
                    
                    // Apply highlight.js
                    hljs.highlightElement(tempElement);
                    
                    return tempElement.innerHTML;
                } catch (e) {
                    console.warn('Highlight.js failed for line, using fallback:', e);
                    // Fall through to basic highlighting
                }
            }
            
            // Fallback to basic regex highlighting
            let highlighted = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
            
            // Skip highlighting for empty lines
            if (highlighted.trim() === '') {
                return highlighted;
            }
            
            // Comment detection (do this first to avoid highlighting inside comments)
            if (highlighted.match(/^\s*\/\//)) {
                return `<span class="hljs-comment">${highlighted}</span>`;
            }
            if (highlighted.match(/^\s*\/\*/) || highlighted.match(/\*\//)) {
                return `<span class="hljs-comment">${highlighted}</span>`;
            }
            
            // TypeScript/JavaScript keywords
            const keywords = [
                'import', 'export', 'from', 'default', 'as',
                'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum',
                'async', 'await', 'return', 'if', 'else', 'for', 'while', 'do',
                'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
                'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly',
                'abstract', 'override', 'declare', 'namespace', 'module',
                'typeof', 'instanceof', 'in', 'of', 'delete', 'void',
                'true', 'false', 'null', 'undefined'
            ];
            
            // React/JSX specific
            const reactKeywords = ['React', 'Component', 'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext'];
            
            // Apply keyword highlighting (simple word boundary matching)
            keywords.forEach(keyword => {
                const regex = new RegExp('\\\\b' + keyword + '\\\\b', 'g');
                highlighted = highlighted.replace(regex, '<span class="hljs-keyword">' + keyword + '</span>');
            });
            
            // React/JSX highlighting
            reactKeywords.forEach(keyword => {
                const regex = new RegExp('\\\\b' + keyword + '\\\\b', 'g');
                highlighted = highlighted.replace(regex, '<span class="hljs-title class_">' + keyword + '</span>');
            });
            
            // String highlighting
            highlighted = highlighted.replace(/(&#x27;[^&#x27;]*&#x27;)/g, '<span class="hljs-string">$1</span>');
            highlighted = highlighted.replace(/(&quot;[^&quot;]*&quot;)/g, '<span class="hljs-string">$1</span>');
            
            // Template literals
            highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="hljs-template-string">$1</span>');
            
            // Type annotations (: Type)
            highlighted = highlighted.replace(/:\\s*([A-Z][a-zA-Z0-9_]*)/g, ': <span class="hljs-type">$1</span>');
            
            // JSX Component names (starting with capital letter)
            if (fileExt === 'tsx' || fileExt === 'jsx') {
                highlighted = highlighted.replace(/&lt;([A-Z][a-zA-Z0-9]*)/g, '&lt;<span class="hljs-name">$1</span>');
            }
            
            return highlighted;
        }
        
        function closeModal(modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        function closeAllModals() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
            // Restore body scroll
            document.body.style.overflow = '';
        }
        
        function setupPaginationHandlers() {
            const firstPageBtn = document.getElementById('first-page');
            const prevPageBtn = document.getElementById('prev-page');
            const nextPageBtn = document.getElementById('next-page');
            const lastPageBtn = document.getElementById('last-page');
            const itemsPerPageSelect = document.getElementById('items-per-page');
            const currentPageInput = document.getElementById('current-page');
            
            if (firstPageBtn) {
                firstPageBtn.addEventListener('click', () => goToPage(1));
            }
            
            if (prevPageBtn) {
                prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
            }
            
            if (nextPageBtn) {
                nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
            }
            
            if (lastPageBtn) {
                lastPageBtn.addEventListener('click', () => goToPage(Math.ceil(filteredRows.length / itemsPerPage)));
            }
            
            if (itemsPerPageSelect) {
                itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
            }
            
            if (currentPageInput) {
                currentPageInput.addEventListener('change', handlePageInputChange);
            }
        }
        
        function setupColumnPickerHandlers() {
            const columnPickerBtn = document.getElementById('column-picker-btn');
            const columnPickerModal = document.getElementById('column-picker-modal');
            const applyColumnsBtn = document.getElementById('apply-columns-btn');
            const resetColumnsBtn = document.getElementById('reset-columns-btn');
            
            if (columnPickerBtn && columnPickerModal) {
                columnPickerBtn.addEventListener('click', () => {
                    columnPickerModal.style.display = 'block';
                });
                
                // Close modal when clicking outside
                columnPickerModal.addEventListener('click', (e) => {
                    if (e.target === columnPickerModal) {
                        closeModal(columnPickerModal);
                    }
                });
                
                // Close modal with close button
                const closeBtn = columnPickerModal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        closeModal(columnPickerModal);
                    });
                }
            }
            
            if (applyColumnsBtn) {
                applyColumnsBtn.addEventListener('click', applyColumnChanges);
            }
            
            if (resetColumnsBtn) {
                resetColumnsBtn.addEventListener('click', resetColumns);
            }
        }
        
        function applyColumnChanges() {
            const checkboxes = document.querySelectorAll('.column-checkbox');
            const table = document.getElementById('gaps-table');
            
            if (!table) return;
            
            checkboxes.forEach(checkbox => {
                const columnId = checkbox.id.replace('col-', '');
                const isVisible = checkbox.checked;
                
                // Show/hide column header
                const header = table.querySelector(`th.col-${columnId}`);
                if (header) {
                    header.style.display = isVisible ? '' : 'none';
                }
                
                // Show/hide column cells
                const cells = table.querySelectorAll(`td.col-${columnId}`);
                cells.forEach(cell => {
                    cell.style.display = isVisible ? '' : 'none';
                });
            });
            
            // Close modal
            const modal = document.getElementById('column-picker-modal');
            if (modal) {
                closeModal(modal);
            }
        }
        
        function resetColumns() {
            const checkboxes = document.querySelectorAll('.column-checkbox');
            const table = document.getElementById('gaps-table');
            
            if (!table) return;
            
            // Reset all checkboxes to checked (except disabled ones)
            checkboxes.forEach(checkbox => {
                if (!checkbox.disabled) {
                    checkbox.checked = true;
                }
            });
            
            // Show all columns
            const headers = table.querySelectorAll('th[class*="col-"]');
            headers.forEach(header => {
                header.style.display = '';
            });
            
            const cells = table.querySelectorAll('td[class*="col-"]');
            cells.forEach(cell => {
                cell.style.display = '';
            });
        }
        
        function setupModalHandlers() {
            // Source code modal triggers
            document.querySelectorAll('.clickable-filename').forEach(filename => {
                filename.addEventListener('click', function() {
                    const row = this.closest('tr');
                    if (row) {
                        openSourceCodeModal(row);
                    }
                });
            });
            
            // Modal close buttons
            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    if (modal) {
                        closeModal(modal);
                    }
                });
            });
            
            // Click outside modal to close
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(event) {
                    if (event.target === this) {
                        closeModal(modal);
                    }
                });
            });
            
            // GitHub button in modal
            const githubBtn = document.getElementById('open-github-btn');
            if (githubBtn) {
                githubBtn.addEventListener('click', function() {
                    const url = this.dataset.githubUrl;
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            }
        }
        
        function handleKeyboardShortcuts(e) {
            // Ctrl+K for column picker
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                const columnPickerModal = document.getElementById('column-picker-modal');
                if (columnPickerModal) {
                    columnPickerModal.style.display = 'block';
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                closeAllModals();
            }
        }
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
        """Generate script tags with actual source code data for modal display."""
        source_code_data = {}
        
        print(f"📄 Embedding source code for {len(report.gaps)} files...")
        
        for gap in report.gaps:
            file_path = gap.code_file
            try:
                # Read the actual file content
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Limit content to first 100 lines for performance
                lines = content.split('\n')
                if len(lines) > 100:
                    content = '\n'.join(lines[:100]) + f'\n\n... (truncated at 100 lines)\n... Total lines: {len(lines)}\n... Click "View on GitHub" for full source'
                
                # Store the source code data
                source_code_data[file_path] = {
                    'content': content,
                    'language': self._get_language_from_extension(file_path),
                    'lines': len(lines),
                    'truncated': len(lines) > 100
                }
                
            except Exception as e:
                # If we can't read the file, create a placeholder
                source_code_data[file_path] = {
                    'content': f'// Could not read file: {file_path}\n// Error: {str(e)}\n// Click "View on GitHub" to see the actual source code',
                    'language': 'text',
                    'lines': 0,
                    'truncated': False
                }
        
        # Generate the JSON data embedding
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