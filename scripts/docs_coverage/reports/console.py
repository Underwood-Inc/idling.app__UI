#!/usr/bin/env python3
"""
Console report generator for documentation coverage analysis
"""

from typing import List
from ..models import CoverageReport
from ..config import ConfigManager

class ConsoleReporter:
    """Generates detailed console reports"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager.config
    
    def generate(self, report: CoverageReport) -> str:
        """Generate detailed console report"""
        output = []
        
        # Header
        output.append("=" * 90)
        output.append("📊 INDUSTRY-STANDARD DOCUMENTATION COVERAGE REPORT")
        output.append("=" * 90)
        output.append("")
        
        # Summary
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        status_emoji = "✅" if report.coverage_percentage >= min_coverage else "❌"
        quality_emoji = "✅" if report.quality_score >= 0.7 else "⚠️" if report.quality_score >= 0.5 else "❌"
        
        output.append(f"{status_emoji} **Coverage**: {report.coverage_percentage:.1f}% ({report.adequately_documented}/{report.total_code_files} files)")
        output.append(f"{quality_emoji} **Quality Score**: {report.quality_score:.2f}/1.0")
        output.append(f"📝 **Missing Documentation**: {report.missing_documentation} files")
        output.append(f"⚠️  **Inadequate Documentation**: {report.inadequate_documentation} files")
        output.append("")
        
        # Priority breakdown
        output.append("🎯 **Priority Breakdown:**")
        for priority, count in report.by_priority.items():
            if count > 0:
                emoji = {"critical": "🚨", "high": "⚠️", "medium": "📝", "low": "💡"}[priority]
                output.append(f"  {emoji} {priority.title()}: {count} files")
        output.append("")
        
        # File type breakdown
        if report.by_file_type:
            output.append("📂 **File Type Breakdown:**")
            for file_type, counts in report.by_file_type.items():
                total = counts.get("missing", 0) + counts.get("inadequate", 0)
                output.append(f"  📁 {file_type.title()}: {total} issues")
                if counts.get("missing", 0) > 0:
                    output.append(f"    ❌ Missing: {counts['missing']}")
                if counts.get("inadequate", 0) > 0:
                    output.append(f"    ⚠️  Inadequate: {counts['inadequate']}")
            output.append("")
        
        # Detailed gaps
        if report.gaps:
            critical_gaps = [g for g in report.gaps if g.priority == "critical"]
            high_gaps = [g for g in report.gaps if g.priority == "high"]
            
            if critical_gaps:
                output.append("🚨 **CRITICAL PRIORITY - Immediate Action Required:**")
                for gap in critical_gaps:
                    output.append(f"  ❌ {gap.code_file}")
                    output.append(f"     📍 Expected: {gap.expected_doc_path}")
                    output.append(f"     📊 Status: {gap.gap_type.title()}")
                    output.append(f"     ⏱️  Effort: {gap.estimated_effort.title()}")
                    if gap.quality_issues:
                        output.append(f"     🔍 Issues: {', '.join(gap.quality_issues)}")
                    output.append("")
            
            if high_gaps:
                output.append("⚠️  **HIGH PRIORITY - Action Needed:**")
                for gap in high_gaps:
                    output.append(f"  ⚠️  {gap.code_file}")
                    output.append(f"     📍 Expected: {gap.expected_doc_path}")
                    output.append(f"     📊 Status: {gap.gap_type.title()}")
                    if gap.quality_issues:
                        output.append(f"     🔍 Issues: {', '.join(gap.quality_issues)}")
                    output.append("")
        
        # Recommendations
        output.append("💡 **Recommendations:**")
        if report.coverage_percentage < min_coverage:
            output.append(f"  • Increase documentation coverage to meet {min_coverage}% minimum")
        if report.quality_score < 0.7:
            output.append("  • Improve documentation quality by adding missing sections")
        if report.missing_documentation > 0:
            output.append("  • Create index.md files for co-located documentation")
        if report.inadequate_documentation > 0:
            output.append("  • Enhance existing documentation with required sections")
        
        output.append("")
        output.append("=" * 90)
        
        return "\n".join(output) 