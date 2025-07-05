#!/usr/bin/env python3
"""
PR-Specific Documentation Coverage Analyzer
Analyzes documentation coverage for only the files changed in a pull request
"""

import sys
import argparse
import os
import subprocess
import json
from datetime import datetime
from docs_coverage import DocumentationChecker, CoverageReport, DocumentationGap, CodeFileAnalysis

def get_pr_changed_files(base_ref="origin/main", head_ref="HEAD"):
    """Get list of files changed in the current PR"""
    try:
        # Get the list of changed files between base and head
        result = subprocess.run([
            "git", "diff", "--name-only", f"{base_ref}...{head_ref}"
        ], capture_output=True, text=True, check=True)
        
        changed_files = [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
        
        # Filter for source files only (TypeScript/JavaScript)
        source_extensions = {'.ts', '.tsx', '.js', '.jsx'}
        source_files = []
        
        for file in changed_files:
            if os.path.exists(file):
                _, ext = os.path.splitext(file)
                if ext in source_extensions:
                    source_files.append(file)
        
        return source_files
    except subprocess.CalledProcessError as e:
        print(f"Error getting changed files: {e}", file=sys.stderr)
        return []

def get_pr_info():
    """Get PR information from environment variables (GitHub Actions)"""
    pr_info = {
        'number': os.environ.get('PR_NUMBER', 'unknown'),
        'title': os.environ.get('PR_TITLE', 'Unknown PR'),
        'base_ref': os.environ.get('PR_BASE_REF', 'origin/main'),
        'head_ref': os.environ.get('PR_HEAD_REF', 'HEAD'),
        'author': os.environ.get('PR_AUTHOR', 'unknown')
    }
    return pr_info

class PRDocumentationChecker(DocumentationChecker):
    """Extended documentation checker for PR-specific analysis"""
    
    def __init__(self, config_file, pr_files=None):
        super().__init__(config_file)
        self.pr_files = pr_files or []
        self.pr_info = get_pr_info()
    
    def filter_code_files_for_pr(self, all_code_files):
        """Filter the code files list to only include PR-changed files"""
        if not self.pr_files:
            return all_code_files
        
        # Convert PR files to absolute paths for comparison
        pr_files_abs = [os.path.abspath(f) for f in self.pr_files]
        
        # Filter all_code_files to only include those in the PR
        filtered_files = []
        for code_file in all_code_files:
            if os.path.abspath(code_file.path) in pr_files_abs:
                filtered_files.append(code_file)
        
        return filtered_files
    
    def check_coverage(self) -> CoverageReport:
        """Check documentation coverage for PR files only"""
        print("🔍 Performing PR-specific documentation coverage analysis...", file=sys.stderr)
        
        # Get all code files first
        all_code_files = self.analyzer.find_code_files()
        
        # Filter to only PR-changed files
        pr_code_files = self.filter_code_files_for_pr(all_code_files)
        
        if not pr_code_files:
            # Create empty report if no PR files found
            return CoverageReport(
                total_code_files=0,
                documented_files=0,
                adequately_documented=0,
                missing_documentation=0,
                inadequate_documentation=0,
                coverage_percentage=100.0,  # 100% if no files to check
                quality_score=1.0,
                gaps=[],
                by_priority={"critical": 0, "high": 0, "medium": 0, "low": 0},
                by_file_type={},
                timestamp=datetime.now().isoformat()
            )
        
        print(f"📁 Found {len(pr_code_files)} PR code files requiring documentation", file=sys.stderr)
        
        # Set the filtered code files for analysis
        self.code_files = pr_code_files
        
        # Find documentation files for PR files only
        self.documentation_files = self.quality_assessor.find_documentation_files(pr_code_files)
        print(f"📚 Found {len(self.documentation_files)} documentation files for PR files", file=sys.stderr)
        
        # Assess documentation quality for PR files
        gaps = []
        adequately_documented = 0
        total_quality_score = 0.0
        
        for code_file in pr_code_files:
            if code_file.path in self.documentation_files:
                doc_path = self.documentation_files[code_file.path]
                quality = self.quality_assessor.assess_documentation_quality(
                    doc_path, code_file.file_type, code_file.priority
                )
                self.quality_assessments[code_file.path] = quality
                
                min_quality = self.config_manager.config["documentation_standards"]["minimum_quality_score"]
                if quality.quality_score >= min_quality:
                    adequately_documented += 1
                else:
                    # Documentation exists but is inadequate
                    gap = DocumentationGap(
                        code_file=code_file.path,
                        expected_doc_path=doc_path,
                        gap_type="inadequate",
                        priority=code_file.priority,
                        required_sections=self.config_manager.config["documentation_standards"]["required_sections"].get(code_file.file_type, []),
                        quality_issues=quality.missing_sections or [],
                        estimated_effort=self.quality_assessor.estimate_effort(quality, code_file)
                    )
                    gaps.append(gap)
                
                total_quality_score += quality.quality_score
            else:
                # Documentation is missing
                expected_doc_path = self.quality_assessor.get_expected_doc_path(code_file)
                gap = DocumentationGap(
                    code_file=code_file.path,
                    expected_doc_path=expected_doc_path,
                    gap_type="missing",
                    priority=code_file.priority,
                    required_sections=self.config_manager.config["documentation_standards"]["required_sections"].get(code_file.file_type, []),
                    quality_issues=["Documentation file does not exist"],
                    estimated_effort=self.quality_assessor.estimate_effort_for_missing(code_file)
                )
                gaps.append(gap)
        
        # Calculate metrics
        documented_files = len(self.documentation_files)
        total_files = len(pr_code_files)
        coverage_percentage = (adequately_documented / total_files * 100) if total_files > 0 else 100
        average_quality = (total_quality_score / documented_files) if documented_files > 0 else 0.0
        
        # Group by priority and file type
        by_priority = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        by_file_type = {}
        
        for gap in gaps:
            by_priority[gap.priority] += 1
            
            file_type = next((cf.file_type for cf in pr_code_files if cf.path == gap.code_file), "unknown")
            if file_type not in by_file_type:
                by_file_type[file_type] = {"missing": 0, "inadequate": 0}
            
            by_file_type[file_type][gap.gap_type] += 1
        
        return CoverageReport(
            total_code_files=total_files,
            documented_files=documented_files,
            adequately_documented=adequately_documented,
            missing_documentation=len([g for g in gaps if g.gap_type == "missing"]),
            inadequate_documentation=len([g for g in gaps if g.gap_type == "inadequate"]),
            coverage_percentage=coverage_percentage,
            quality_score=average_quality,
            gaps=gaps,
            by_priority=by_priority,
            by_file_type=by_file_type,
            timestamp=datetime.now().isoformat()
        )

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="PR-specific documentation coverage checker")
    parser.add_argument("--config", default="scripts/docs-coverage-config.json", help="Configuration file")
    parser.add_argument("--format", choices=["console", "json", "markdown", "html", "csv"], 
                       default="json", help="Output format")
    parser.add_argument("--output", help="Output file (default: stdout for console/json)")
    parser.add_argument("--base-ref", default="origin/main", help="Base reference for PR comparison")
    parser.add_argument("--head-ref", default="HEAD", help="Head reference for PR comparison")
    parser.add_argument("--pr-number", help="PR number (for reporting)")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress verbose output")
    
    args = parser.parse_args()
    
    # Set environment variables for PR info if provided
    if args.pr_number:
        os.environ['PR_NUMBER'] = args.pr_number
    
    # Get PR changed files
    if not args.quiet:
        print("🔍 Analyzing PR-specific documentation coverage...", file=sys.stderr)
    
    pr_files = get_pr_changed_files(args.base_ref, args.head_ref)
    
    if not pr_files:
        if not args.quiet:
            print("ℹ️ No source files changed in this PR", file=sys.stderr)
        
        # Output empty report
        if args.format == "json":
            empty_report = {
                "pr_info": get_pr_info(),
                "total_code_files": 0,
                "documented_files": 0,
                "adequately_documented": 0,
                "coverage_percentage": 100.0,
                "quality_score": 1.0,
                "gaps": [],
                "by_priority": {"critical": 0, "high": 0, "medium": 0, "low": 0},
                "by_file_type": {},
                "message": "No source files changed in this PR"
            }
            print(json.dumps(empty_report, indent=2))
        else:
            print("No source files changed in this PR")
        return
    
    if not args.quiet:
        print(f"📊 Found {len(pr_files)} changed source files in PR:", file=sys.stderr)
        for f in pr_files:
            print(f"  - {f}", file=sys.stderr)
    
    # Create PR-specific checker
    checker = PRDocumentationChecker(args.config, pr_files)
    
    # Check coverage
    report = checker.check_coverage()
    
    # Generate output
    if args.format == "json":
        # Custom JSON output with PR information
        pr_report = {
            "pr_info": get_pr_info(),
            "pr_files": pr_files,
            "total_code_files": report.total_code_files,
            "documented_files": report.documented_files,
            "adequately_documented": report.adequately_documented,
            "missing_documentation": report.missing_documentation,
            "inadequate_documentation": report.inadequate_documentation,
            "coverage_percentage": report.coverage_percentage,
            "quality_score": report.quality_score,
            "gaps": [gap.__dict__ for gap in report.gaps],
            "by_priority": report.by_priority,
            "by_file_type": report.by_file_type,
            "timestamp": report.timestamp
        }
        
        output = json.dumps(pr_report, indent=2)
    else:
        # Use standard reporter for other formats
        output = checker.generate_report(report, args.format)
    
    # Output the report
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        if not args.quiet:
            print(f"📄 PR coverage report written to {args.output}", file=sys.stderr)
    else:
        print(output)
    
    # Summary for stderr
    if not args.quiet:
        print(f"\n📊 PR Documentation Coverage Summary:", file=sys.stderr)
        print(f"  Files Changed: {len(pr_files)}", file=sys.stderr)
        print(f"  Files Documented: {report.documented_files}/{report.total_code_files}", file=sys.stderr)
        print(f"  Coverage: {report.coverage_percentage:.1f}%", file=sys.stderr)
        print(f"  Quality Score: {report.quality_score:.2f}", file=sys.stderr)

if __name__ == "__main__":
    main() 