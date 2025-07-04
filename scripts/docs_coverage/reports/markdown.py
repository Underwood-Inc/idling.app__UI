#!/usr/bin/env python3
"""
Markdown report generator for Jekyll documentation
"""

from ..models import CoverageReport
from ..config import ConfigManager

class MarkdownReporter:
    """Generates markdown reports for Jekyll"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager.config
    
    def generate(self, report: CoverageReport) -> str:
        """Generate markdown report for Jekyll"""
        output = []
        
        output.append("---")
        output.append("title: Documentation Coverage Report")
        output.append("category: quality-assurance")
        output.append("tags: [documentation, coverage, quality]")
        output.append(f"generated: {report.timestamp}")
        output.append("---")
        output.append("")
        
        output.append("# Documentation Coverage Report")
        output.append("")
        output.append(f"**Generated:** {report.timestamp}")
        output.append(f"**Coverage:** {report.coverage_percentage:.1f}% ({report.adequately_documented}/{report.total_code_files} files)")
        output.append(f"**Quality Score:** {report.quality_score:.2f}/1.0")
        output.append("")
        
        # Summary table
        output.append("## 📊 Summary")
        output.append("")
        output.append("| Metric | Value |")
        output.append("|--------|-------|")
        output.append(f"| Total Code Files | {report.total_code_files} |")
        output.append(f"| Documented Files | {report.documented_files} |")
        output.append(f"| Adequately Documented | {report.adequately_documented} |")
        output.append(f"| Missing Documentation | {report.missing_documentation} |")
        output.append(f"| Inadequate Documentation | {report.inadequate_documentation} |")
        output.append(f"| Coverage Percentage | {report.coverage_percentage:.1f}% |")
        output.append(f"| Average Quality Score | {report.quality_score:.2f}/1.0 |")
        output.append("")
        
        # Priority breakdown
        if any(count > 0 for count in report.by_priority.values()):
            output.append("## 🎯 Priority Breakdown")
            output.append("")
            output.append("| Priority | Count | Description |")
            output.append("|----------|-------|-------------|")
            
            priority_descriptions = {
                "critical": "Public APIs, complex services - immediate action required",
                "high": "Core components, important utilities - action needed soon",
                "medium": "Supporting code, hooks - should be documented",
                "low": "Internal utilities, simple helpers - nice to have"
            }
            
            for priority, count in report.by_priority.items():
                if count > 0:
                    emoji = {"critical": "🚨", "high": "⚠️", "medium": "📝", "low": "💡"}[priority]
                    desc = priority_descriptions[priority]
                    output.append(f"| {emoji} {priority.title()} | {count} | {desc} |")
            
            output.append("")
        
        # Detailed gaps
        if report.gaps:
            output.append("## ❌ Documentation Gaps")
            output.append("")
            
            for priority in ["critical", "high", "medium", "low"]:
                priority_gaps = [g for g in report.gaps if g.priority == priority]
                if priority_gaps:
                    emoji = {"critical": "🚨", "high": "⚠️", "medium": "📝", "low": "💡"}[priority]
                    output.append(f"### {emoji} {priority.title()} Priority")
                    output.append("")
                    
                    output.append("| File | Status | Expected Documentation | Issues |")
                    output.append("|------|--------|------------------------|--------|")
                    
                    for gap in priority_gaps:
                        file_name = gap.code_file.split("/")[-1]
                        doc_name = gap.expected_doc_path.split("/")[-1]
                        issues = ", ".join(gap.quality_issues[:3])  # Limit to first 3 issues
                        if len(gap.quality_issues) > 3:
                            issues += "..."
                        
                        output.append(f"| `{file_name}` | {gap.gap_type.title()} | `{doc_name}` | {issues} |")
                    
                    output.append("")
        
        return "\n".join(output) 