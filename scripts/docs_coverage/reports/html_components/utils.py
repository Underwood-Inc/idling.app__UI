#!/usr/bin/env python3
"""
Utility functions for HTML report generation.

This module contains helper functions for generating badges, CSS classes,
and other utilities used throughout the HTML report generation process.
"""

from typing import Dict, Any


class HtmlUtils:
    """Utility class for HTML report generation helpers."""
    
    @staticmethod
    def get_priority_badge(priority: str) -> str:
        """Get priority badge HTML with appropriate styling and icons."""
        badges = {
            'critical': '<span class="badge badge-error">🚨 Critical</span>',
            'high': '<span class="badge badge-warning">⚠️ High</span>',
            'medium': '<span class="badge badge-info">📝 Medium</span>',
            'low': '<span class="badge badge-success">💡 Low</span>'
        }
        return badges.get(priority.lower(), '<span class="badge">Unknown</span>')
    
    @staticmethod
    def get_gap_status_badge(gap_type: str) -> str:
        """Get gap status badge HTML with appropriate styling and icons."""
        badges = {
            'missing': '<span class="badge badge-error">❌ Missing</span>',
            'inadequate': '<span class="badge badge-warning">⚠️ Inadequate</span>',
            'outdated': '<span class="badge badge-info">🔄 Outdated</span>'
        }
        return badges.get(gap_type.lower(), '<span class="badge">Unknown</span>')
    
    @staticmethod
    def get_coverage_class(coverage_pct: float, min_coverage: float) -> str:
        """Get CSS class for coverage percentage based on thresholds."""
        if coverage_pct >= min_coverage:
            return 'quality-excellent'
        elif coverage_pct >= min_coverage * 0.8:
            return 'quality-good'
        elif coverage_pct >= min_coverage * 0.6:
            return 'quality-fair'
        else:
            return 'quality-poor'
    
    @staticmethod
    def get_quality_class(quality_score: float) -> str:
        """Get CSS class for quality score based on standard thresholds."""
        if quality_score >= 0.8:
            return 'quality-excellent'
        elif quality_score >= 0.6:
            return 'quality-good'
        elif quality_score >= 0.4:
            return 'quality-fair'
        else:
            return 'quality-poor'
    
    @staticmethod
    def get_status_class(is_good: bool) -> str:
        """Get CSS class for boolean status indicators."""
        return 'quality-excellent' if is_good else 'quality-poor'
    
    @staticmethod
    def estimate_doc_size(effort: str) -> str:
        """Estimate documentation size based on effort level."""
        size_map = {
            'low': 'Small (< 500 words)',
            'medium': 'Medium (500-1500 words)', 
            'high': 'Large (1500+ words)'
        }
        return size_map.get(effort.lower(), 'Unknown')
    
    @staticmethod
    def get_priority_sort_value(priority: str) -> int:
        """Get numeric sort value for priority (higher number = higher priority)."""
        priority_values = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        }
        return priority_values.get(priority.lower(), 0)
    
    @staticmethod
    def get_effort_sort_value(effort: str) -> int:
        """Get numeric sort value for effort (higher number = more effort)."""
        effort_values = {
            'low': 1,
            'medium': 2,
            'high': 3
        }
        return effort_values.get(effort.lower(), 0)
    
    @staticmethod
    def generate_console_summary(report: Any, output_file: str) -> str:
        """Generate a beautiful console summary for the generated report."""
        return f"""
🎨 Beautiful HTML Report Generated! ✨

📊 Coverage Summary:
   • Total Files: {report.total_code_files}
   • Documented: {report.adequately_documented}
   • Coverage: {report.coverage_percentage:.1f}%
   • Quality Score: {report.quality_score:.2f}

📄 Report Details:
   • File: {output_file}
   • Theme: Dark/Light support with product colors
   • Features: Interactive, responsive, accessible

🔧 Enhanced Features:
   • ✅ Fixed clickable elements and event handling
   • ✅ Improved file path contrast and legibility  
   • ✅ Better cell truncation with hover expansion
   • ✅ Enhanced scrollbar styling with golden theme
   • ✅ Advanced multi-sort with visual indicators
   • ✅ Modular architecture (<300 lines per file)

🧙‍♂️ Open the HTML file in your browser to explore the beautiful report with Idling.app's signature golden theme!
        """


class BadgeGenerator:
    """Specialized class for generating various types of badges."""
    
    def __init__(self):
        self.utils = HtmlUtils()
    
    def priority_badge(self, priority: str) -> str:
        """Generate priority badge."""
        return self.utils.get_priority_badge(priority)
    
    def status_badge(self, gap_type: str) -> str:
        """Generate status badge."""
        return self.utils.get_gap_status_badge(gap_type)
    
    def coverage_badge(self, coverage_pct: float, min_coverage: float = 80.0) -> str:
        """Generate coverage badge with percentage."""
        css_class = self.utils.get_coverage_class(coverage_pct, min_coverage)
        icon = self._get_coverage_icon(coverage_pct, min_coverage)
        return f'<span class="badge {css_class}">{icon} {coverage_pct:.1f}%</span>'
    
    def quality_badge(self, quality_score: float) -> str:
        """Generate quality badge with score."""
        css_class = self.utils.get_quality_class(quality_score)
        icon = self._get_quality_icon(quality_score)
        return f'<span class="badge {css_class}">{icon} {quality_score:.2f}</span>'
    
    def _get_coverage_icon(self, coverage_pct: float, min_coverage: float) -> str:
        """Get appropriate icon for coverage percentage."""
        if coverage_pct >= min_coverage:
            return '✅'
        elif coverage_pct >= min_coverage * 0.8:
            return '👍'
        elif coverage_pct >= min_coverage * 0.6:
            return '⚠️'
        else:
            return '❌'
    
    def _get_quality_icon(self, quality_score: float) -> str:
        """Get appropriate icon for quality score."""
        if quality_score >= 0.8:
            return '⭐'
        elif quality_score >= 0.6:
            return '👍'
        elif quality_score >= 0.4:
            return '📝'
        else:
            return '⚠️'


class CssClassHelper:
    """Helper class for generating CSS classes based on data values."""
    
    def __init__(self):
        self.utils = HtmlUtils()
    
    def get_row_class(self, priority: str, gap_type: str) -> str:
        """Get CSS class for table row based on priority and gap type."""
        priority_class = f"priority-{priority.lower()}"
        gap_class = f"gap-{gap_type.lower()}"
        return f"table-row {priority_class} {gap_class}"
    
    def get_cell_class(self, column_type: str, value: Any = None) -> str:
        """Get CSS class for table cell based on column type and value."""
        base_class = f"cell-{column_type}"
        
        if column_type == 'priority' and value:
            return f"{base_class} {self.utils.get_priority_sort_value(str(value))}"
        elif column_type == 'coverage' and isinstance(value, (int, float)):
            return f"{base_class} {self.utils.get_coverage_class(value, 80.0)}"
        elif column_type == 'quality' and isinstance(value, (int, float)):
            return f"{base_class} {self.utils.get_quality_class(value)}"
        
        return base_class
    
    def get_filter_class(self, filter_type: str, is_active: bool = False) -> str:
        """Get CSS class for filter elements."""
        base_class = f"filter-{filter_type}"
        if is_active:
            return f"{base_class} active"
        return base_class


# Export the main classes and utility functions
__all__ = [
    'HtmlUtils',
    'BadgeGenerator', 
    'CssClassHelper'
] 