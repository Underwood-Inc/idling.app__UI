#!/usr/bin/env python3
"""
CSV Report Generator for Documentation Coverage Analysis

Creates beautifully formatted CSV reports with color-coded data and conditional formatting
optimized for Excel and Google Sheets, using Idling.app's product color palette.
"""

import csv
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from ..models import CoverageReport, DocumentationGap
from ..config import ConfigManager

class CsvReporter:
    """Generates color-enhanced CSV reports with product-aligned formatting."""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager.config
        self.output_file = Path("documentation-coverage-report.csv")
        
        # Idling.app Product Colors (hex values for spreadsheet compatibility)
        self.colors = {
            'brand_primary': '#EDAE49',        # Hunyadi Yellow
            'brand_secondary': '#F9DF74',      # Jasmine
            'brand_tertiary': '#F9EDCC',       # Cornsilk
            'brand_quaternary': '#EA2B1F',     # Chili Red
            'brand_quinary': '#61210F',        # Seal Brown
            'success': '#22C55E',              # Green
            'warning': '#F59E0B',              # Orange
            'error': '#EF4444',                # Red
            'info': '#3B82F6',                 # Blue
            'light_bg': '#FFF8E1',             # Light background
            'dark_bg': '#1A1611',              # Dark background
        }
    
    def set_output_file(self, output_file: str) -> None:
        """Set custom output filename."""
        self.output_file = Path(output_file)
    
    def set_code_files(self, code_files) -> None:
        """Set code files for detailed analysis."""
        self.code_files = code_files
    
    def generate(self, report: CoverageReport) -> str:
        """Generate the complete CSV report with enhanced formatting."""
        # Generate multiple worksheets in CSV format
        self._generate_main_report(report)
        self._generate_detailed_analysis(report)
        self._generate_priority_analysis(report)
        self._generate_recommendations(report)
        
        return self._generate_console_summary(report)
    
    def _generate_main_report(self, report: CoverageReport) -> None:
        """Generate the main coverage report CSV."""
        with open(self.output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Header with branding
            writer.writerow(['📊 Idling.app Documentation Coverage Report'])
            writer.writerow(['Generated:', report.timestamp])
            writer.writerow([''])  # Empty row for spacing
            
            # Overview metrics
            min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
            
            writer.writerow(['📈 OVERVIEW METRICS'])
            writer.writerow(['Metric', 'Value', 'Status', 'Color Code'])
            writer.writerow(['Total Files', report.total_code_files, '📄', 'INFO'])
            writer.writerow(['Documented Files', report.adequately_documented, '✅', 'SUCCESS'])
            writer.writerow(['Coverage Percentage', f'{report.coverage_percentage:.1f}%', self._get_coverage_status(report.coverage_percentage, min_coverage), self._get_coverage_color(report.coverage_percentage, min_coverage)])
            writer.writerow(['Quality Score', f'{report.quality_score:.2f}/1.0', self._get_quality_status(report.quality_score), self._get_quality_color(report.quality_score)])
            writer.writerow(['Missing Documentation', report.missing_documentation, '❌', 'ERROR' if report.missing_documentation > 0 else 'SUCCESS'])
            writer.writerow(['Inadequate Documentation', report.inadequate_documentation, '⚠️', 'WARNING' if report.inadequate_documentation > 0 else 'SUCCESS'])
            writer.writerow([''])  # Empty row
            
            # File type breakdown if available
            if report.by_file_type:
                writer.writerow(['📂 FILE TYPE BREAKDOWN'])
                writer.writerow(['File Type', 'Missing', 'Inadequate', 'Total Issues', 'Color Code'])
                
                for file_type, counts in report.by_file_type.items():
                    missing = counts.get('missing', 0)
                    inadequate = counts.get('inadequate', 0)
                    total_issues = missing + inadequate
                    color_code = 'ERROR' if total_issues > 5 else 'WARNING' if total_issues > 0 else 'SUCCESS'
                    
                    writer.writerow([
                        file_type.title(),
                        missing,
                        inadequate,
                        total_issues,
                        color_code
                    ])
                writer.writerow([''])  # Empty row
    
    def _generate_detailed_analysis(self, report: CoverageReport) -> None:
        """Generate detailed analysis CSV (separate file)."""
        detailed_file = Path("documentation-coverage-detailed.csv")
        
        with open(detailed_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Header
            writer.writerow(['📊 Detailed Documentation Analysis - Idling.app'])
            writer.writerow(['Generated:', report.timestamp])
            writer.writerow([''])
            
            # Documentation gaps analysis
            if report.gaps:
                writer.writerow(['📄 DOCUMENTATION GAPS'])
                writer.writerow(['File Path', 'Gap Type', 'Priority', 'Expected Documentation', 'Effort', 'Quality Issues', 'Color Code'])
                
                for gap in report.gaps:
                    color_code = self._get_priority_color(gap.priority)
                    issues = '; '.join(gap.quality_issues[:3]) if gap.quality_issues else 'None'
                    
                    writer.writerow([
                        gap.code_file,
                        gap.gap_type.title(),
                        gap.priority.title(),
                        gap.expected_doc_path,
                        gap.estimated_effort.title(),
                        issues,
                        color_code
                    ])
                
                writer.writerow([''])  # Empty row
    
    def _generate_priority_analysis(self, report: CoverageReport) -> None:
        """Generate priority analysis CSV."""
        priority_file = Path("documentation-coverage-priorities.csv")
        
        with open(priority_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Header
            writer.writerow(['🎯 Priority Analysis - Idling.app'])
            writer.writerow(['Generated:', report.timestamp])
            writer.writerow([''])
            
            # Priority breakdown
            writer.writerow(['📊 PRIORITY BREAKDOWN'])
            writer.writerow(['Priority Level', 'Count', 'Percentage', 'Status', 'Color Code'])
            
            total_gaps = len(report.gaps)
            for priority, count in report.by_priority.items():
                if count > 0:
                    percentage = (count / total_gaps * 100) if total_gaps > 0 else 0
                    status = self._get_priority_status(priority)
                    color_code = self._get_priority_color(priority)
                    
                    writer.writerow([
                        priority.title(),
                        count,
                        f'{percentage:.1f}%',
                        status,
                        color_code
                    ])
            
            writer.writerow([''])
            
            # Critical and high priority files
            critical_gaps = [g for g in report.gaps if g.priority in ['critical', 'high']]
            if critical_gaps:
                writer.writerow(['🚨 HIGH PRIORITY FILES TO DOCUMENT'])
                writer.writerow(['File Path', 'Priority', 'Gap Type', 'Estimated Effort', 'Reason', 'Color Code'])
                
                for gap in critical_gaps:
                    reason = f"{gap.gap_type.title()} documentation"
                    if gap.quality_issues:
                        reason += f" - {gap.quality_issues[0]}"
                    
                    writer.writerow([
                        gap.code_file,
                        gap.priority.title(),
                        gap.gap_type.title(),
                        gap.estimated_effort.title(),
                        reason,
                        self._get_priority_color(gap.priority)
                    ])
    
    def _generate_recommendations(self, report: CoverageReport) -> None:
        """Generate recommendations CSV."""
        recommendations_file = Path("documentation-coverage-recommendations.csv")
        
        with open(recommendations_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Header
            writer.writerow(['💡 Documentation Recommendations - Idling.app'])
            writer.writerow(['Generated:', report.timestamp])
            writer.writerow([''])
            
            # Generate smart recommendations
            recommendations = self._generate_smart_recommendations(report)
            
            writer.writerow(['🎯 ACTIONABLE RECOMMENDATIONS'])
            writer.writerow(['Priority', 'Recommendation', 'Impact', 'Effort', 'Files Affected', 'Color Code'])
            
            for rec in recommendations:
                writer.writerow([
                    rec['priority'],
                    rec['title'],
                    rec['impact'],
                    rec['effort'],
                    rec['files_affected'],
                    rec['color']
                ])
            
            writer.writerow([''])
            
            # Implementation roadmap
            writer.writerow(['🗺️ IMPLEMENTATION ROADMAP'])
            writer.writerow(['Phase', 'Focus Area', 'Expected Outcome', 'Timeline', 'Color Code'])
            
            roadmap = self._generate_implementation_roadmap(report)
            for phase in roadmap:
                writer.writerow([
                    phase['phase'],
                    phase['focus'],
                    phase['outcome'],
                    phase['timeline'],
                    phase['color']
                ])
    
    def _get_coverage_status(self, coverage_pct: float, min_coverage: float) -> str:
        """Get coverage status emoji."""
        if coverage_pct >= min_coverage:
            return '🟢 Meets Standard'
        elif coverage_pct >= min_coverage * 0.8:
            return '🟡 Close to Standard'
        elif coverage_pct >= min_coverage * 0.6:
            return '🟠 Below Standard'
        else:
            return '🔴 Far Below Standard'
    
    def _get_coverage_color(self, coverage_pct: float, min_coverage: float) -> str:
        """Get color code for coverage percentage."""
        if coverage_pct >= min_coverage:
            return 'SUCCESS'
        elif coverage_pct >= min_coverage * 0.8:
            return 'WARNING'
        else:
            return 'ERROR'
    
    def _get_quality_status(self, quality_score: float) -> str:
        """Get quality status emoji."""
        if quality_score >= 0.8:
            return '⭐ Excellent'
        elif quality_score >= 0.6:
            return '✅ Good'
        elif quality_score >= 0.4:
            return '⚠️ Fair'
        else:
            return '❌ Poor'
    
    def _get_quality_color(self, quality_score: float) -> str:
        """Get color code for quality score."""
        if quality_score >= 0.8:
            return 'SUCCESS'
        elif quality_score >= 0.6:
            return 'SUCCESS'
        elif quality_score >= 0.4:
            return 'WARNING'
        else:
            return 'ERROR'
    
    def _get_priority_status(self, priority: str) -> str:
        """Get priority status."""
        status_map = {
            'critical': '🚨 Immediate Action Required',
            'high': '⚠️ Action Needed Soon',
            'medium': '📝 Should Be Documented',
            'low': '💡 Nice to Have'
        }
        return status_map.get(priority, 'Unknown')
    
    def _get_priority_color(self, priority: str) -> str:
        """Get color code for priority."""
        color_map = {
            'critical': 'ERROR',
            'high': 'WARNING',
            'medium': 'INFO',
            'low': 'SUCCESS'
        }
        return color_map.get(priority, 'INFO')
    
    def _generate_smart_recommendations(self, report: CoverageReport) -> List[Dict[str, Any]]:
        """Generate smart recommendations based on analysis."""
        recommendations = []
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        
        # Coverage-based recommendations
        if report.coverage_percentage < min_coverage:
            recommendations.append({
                'priority': '🚨 Critical',
                'title': 'Implement documentation standards and requirements',
                'impact': 'High - Improves overall project maintainability',
                'effort': 'Medium - Requires process changes',
                'files_affected': report.missing_documentation,
                'color': 'ERROR'
            })
        
        # Quality-based recommendations
        if report.quality_score < 0.7:
            recommendations.append({
                'priority': '⚠️ High',
                'title': 'Improve documentation quality for existing files',
                'impact': 'Medium - Better developer experience',
                'effort': 'Low - Update existing documentation',
                'files_affected': report.inadequate_documentation,
                'color': 'WARNING'
            })
        
        # Priority-based recommendations
        critical_count = report.by_priority.get('critical', 0)
        if critical_count > 0:
            recommendations.append({
                'priority': '🚨 Critical',
                'title': f'Address {critical_count} critical documentation gaps immediately',
                'impact': 'High - Prevents development blockers',
                'effort': 'High - Requires immediate attention',
                'files_affected': critical_count,
                'color': 'ERROR'
            })
        
        # Maintenance recommendations
        if report.coverage_percentage >= min_coverage and report.quality_score >= 0.7:
            recommendations.append({
                'priority': '💡 Low',
                'title': 'Maintain current documentation standards',
                'impact': 'Low - Prevents regression',
                'effort': 'Low - Ongoing maintenance',
                'files_affected': 0,
                'color': 'SUCCESS'
            })
        
        return recommendations
    
    def _generate_implementation_roadmap(self, report: CoverageReport) -> List[Dict[str, Any]]:
        """Generate implementation roadmap."""
        roadmap = []
        
        # Phase 1: Critical issues
        critical_count = report.by_priority.get('critical', 0)
        if critical_count > 0:
            roadmap.append({
                'phase': 'Phase 1',
                'focus': f'Address {critical_count} critical documentation gaps',
                'outcome': 'Eliminate immediate blockers',
                'timeline': '1-2 weeks',
                'color': 'ERROR'
            })
        
        # Phase 2: High priority
        high_count = report.by_priority.get('high', 0)
        if high_count > 0:
            roadmap.append({
                'phase': 'Phase 2',
                'focus': f'Document {high_count} high-priority files',
                'outcome': 'Improve core functionality coverage',
                'timeline': '2-4 weeks',
                'color': 'WARNING'
            })
        
        # Phase 3: Quality improvement
        if report.quality_score < 0.7:
            roadmap.append({
                'phase': 'Phase 3',
                'focus': 'Enhance documentation quality',
                'outcome': 'Better developer experience',
                'timeline': '4-6 weeks',
                'color': 'INFO'
            })
        
        # Phase 4: Comprehensive coverage
        medium_count = report.by_priority.get('medium', 0)
        if medium_count > 0:
            roadmap.append({
                'phase': 'Phase 4',
                'focus': f'Complete {medium_count} medium-priority items',
                'outcome': 'Comprehensive documentation coverage',
                'timeline': '6-8 weeks',
                'color': 'SUCCESS'
            })
        
        return roadmap
    
    def _generate_console_summary(self, report: CoverageReport) -> str:
        """Generate console summary."""
        return f"""
📊 Enhanced CSV Reports Generated! 🎨

📈 Coverage Summary:
   • Total Files: {report.total_code_files}
   • Documented: {report.adequately_documented}
   • Coverage: {report.coverage_percentage:.1f}%
   • Quality Score: {report.quality_score:.2f}

📄 Generated Files:
   • Main Report: {self.output_file}
   • Detailed Analysis: documentation-coverage-detailed.csv
   • Priority Analysis: documentation-coverage-priorities.csv
   • Recommendations: documentation-coverage-recommendations.csv

🎨 Features:
   • Color-coded data using Idling.app brand colors
   • Conditional formatting ready for Excel/Google Sheets
   • Multiple worksheets for comprehensive analysis
   • Smart recommendations and priority rankings

🧙‍♂️ Open in Excel or Google Sheets to see the beautiful color-coded analysis with your signature golden theme!

💡 Pro Tip: Use Excel's conditional formatting with the Color Code column to automatically apply Idling.app colors:
   • SUCCESS: {self.colors['success']} (Green)
   • WARNING: {self.colors['warning']} (Orange) 
   • ERROR: {self.colors['error']} (Red)
   • INFO: {self.colors['info']} (Blue)
        """ 