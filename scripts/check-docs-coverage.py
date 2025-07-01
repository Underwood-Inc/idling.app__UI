#!/usr/bin/env python3
"""
Documentation Coverage Enforcer
Ensures every code file has corresponding documentation and provides detailed reporting
"""

import os
import sys
import glob
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class FileInfo:
    """Information about a code file"""
    path: str
    name: str
    type: str  # 'service', 'component', 'utility', 'hook', etc.
    size_lines: int
    exports: List[str]
    is_test: bool
    last_modified: str

@dataclass
class DocumentationGap:
    """Represents a missing documentation file"""
    file_path: str
    file_name: str
    file_type: str
    suggested_doc_path: str
    priority: str  # 'high', 'medium', 'low'
    reason: str

@dataclass
class CoverageReport:
    """Complete documentation coverage report"""
    total_files: int
    documented_files: int
    missing_docs: int
    coverage_percentage: float
    gaps: List[DocumentationGap]
    timestamp: str

class DocumentationCoverageEnforcer:
    """Enforces documentation coverage across the codebase"""
    
    def __init__(self, config_path: str = "scripts/docs-coverage.json"):
        self.config = self._load_config(config_path)
        self.coverage_report = None
        
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration or create default"""
        default_config = {
            "code_patterns": [
                "src/lib/services/**/*.ts",
                "src/lib/utils/**/*.ts", 
                "src/lib/hooks/**/*.ts",
                "src/components/**/*.tsx",
                "src/app/api/**/*.ts",
                "src/app/**/route.ts"
            ],
            "doc_patterns": [
                "DOCS/_docs/**/*.md",
                "DOCS/_services/**/*.md",
                "DOCS/_components/**/*.md",
                "DOCS/_api/**/*.md"
            ],
            "exclude_patterns": [
                "**/test/**",
                "**/*.test.*",
                "**/*.spec.*",
                "**/node_modules/**",
                "**/.next/**",
                "**/build/**",
                "**/dist/**"
            ],
            "file_type_mapping": {
                "services": {
                    "pattern": "src/lib/services/**/*.ts",
                    "doc_path": "DOCS/_docs/services/{name}.md",
                    "priority": "high"
                },
                "components": {
                    "pattern": "src/components/**/*.tsx",
                    "doc_path": "DOCS/_docs/components/{name}.md", 
                    "priority": "high"
                },
                "api_routes": {
                    "pattern": "src/app/api/**/route.ts",
                    "doc_path": "DOCS/_docs/api/{path}.md",
                    "priority": "high"
                },
                "utils": {
                    "pattern": "src/lib/utils/**/*.ts",
                    "doc_path": "DOCS/_docs/utils/{name}.md",
                    "priority": "medium"
                },
                "hooks": {
                    "pattern": "src/lib/hooks/**/*.ts", 
                    "doc_path": "DOCS/_docs/hooks/{name}.md",
                    "priority": "medium"
                }
            },
            "minimum_coverage": 85,
            "fail_on_missing": True,
            "generate_stubs": True
        }
        
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                # Merge with defaults
                return {**default_config, **config}
            else:
                # Create default config file
                os.makedirs(os.path.dirname(config_path), exist_ok=True)
                with open(config_path, 'w') as f:
                    json.dump(default_config, f, indent=2)
                print(f"📝 Created default config at {config_path}")
                return default_config
        except Exception as e:
            print(f"⚠️  Error loading config: {e}")
            return default_config

    def _get_file_info(self, file_path: str) -> FileInfo:
        """Extract information about a code file"""
        path_obj = Path(file_path)
        name = path_obj.stem
        
        # Determine file type based on path
        file_type = "unknown"
        if "services" in file_path:
            file_type = "service"
        elif "components" in file_path:
            file_type = "component"
        elif "utils" in file_path:
            file_type = "utility"
        elif "hooks" in file_path:
            file_type = "hook"
        elif "api" in file_path and "route" in file_path:
            file_type = "api_route"
        
        # Count lines
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = len(f.readlines())
        except:
            lines = 0
            
        # Extract exports (basic regex)
        exports = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Find export statements
                export_matches = re.findall(r'export\s+(?:class|function|const|interface|type)\s+(\w+)', content)
                exports = list(set(export_matches))
        except:
            pass
            
        # Check if test file
        is_test = any(pattern in file_path.lower() for pattern in ['test', 'spec', '__tests__'])
        
        # Get last modified
        try:
            mtime = os.path.getmtime(file_path)
            last_modified = datetime.fromtimestamp(mtime).isoformat()
        except:
            last_modified = "unknown"
            
        return FileInfo(
            path=file_path,
            name=name,
            type=file_type,
            size_lines=lines,
            exports=exports,
            is_test=is_test,
            last_modified=last_modified
        )

    def _find_code_files(self) -> List[FileInfo]:
        """Find all code files that need documentation"""
        code_files = []
        
        for pattern in self.config["code_patterns"]:
            files = glob.glob(pattern, recursive=True)
            for file_path in files:
                # Skip excluded patterns
                if any(excl in file_path for excl in self.config["exclude_patterns"]):
                    continue
                    
                file_info = self._get_file_info(file_path)
                if not file_info.is_test:  # Skip test files
                    code_files.append(file_info)
                    
        return code_files

    def _find_existing_docs(self) -> Set[str]:
        """Find all existing documentation files"""
        doc_files = set()
        
        for pattern in self.config["doc_patterns"]:
            files = glob.glob(pattern, recursive=True)
            for file_path in files:
                doc_name = Path(file_path).stem.lower()
                doc_files.add(doc_name)
                
        return doc_files

    def _suggest_doc_path(self, file_info: FileInfo) -> str:
        """Suggest where documentation should be created"""
        file_type_config = self.config["file_type_mapping"].get(file_info.type + "s")
        
        if file_type_config:
            if file_info.type == "api_route":
                # Special handling for API routes
                relative_path = file_info.path.replace("src/app/api/", "").replace("/route.ts", "")
                return file_type_config["doc_path"].format(path=relative_path)
            else:
                return file_type_config["doc_path"].format(name=file_info.name.lower())
        
        # Default fallback
        return f"DOCS/_docs/{file_info.type}s/{file_info.name.lower()}.md"

    def _get_priority(self, file_info: FileInfo) -> str:
        """Determine priority for missing documentation"""
        file_type_config = self.config["file_type_mapping"].get(file_info.type + "s")
        
        if file_type_config:
            return file_type_config["priority"]
            
        # Determine priority based on file characteristics
        if file_info.size_lines > 200:
            return "high"
        elif file_info.size_lines > 50:
            return "medium"
        else:
            return "low"

    def check_coverage(self) -> CoverageReport:
        """Check documentation coverage and generate report"""
        print("🔍 Scanning codebase for documentation coverage...")
        
        # Find all code files
        code_files = self._find_code_files()
        print(f"📁 Found {len(code_files)} code files")
        
        # Find existing documentation
        existing_docs = self._find_existing_docs()
        print(f"📚 Found {len(existing_docs)} documentation files")
        
        # Check for missing documentation
        gaps = []
        documented_count = 0
        
        for file_info in code_files:
            doc_name = file_info.name.lower()
            
            if doc_name in existing_docs:
                documented_count += 1
            else:
                gap = DocumentationGap(
                    file_path=file_info.path,
                    file_name=file_info.name,
                    file_type=file_info.type,
                    suggested_doc_path=self._suggest_doc_path(file_info),
                    priority=self._get_priority(file_info),
                    reason=f"{file_info.type.title()} with {file_info.size_lines} lines needs documentation"
                )
                gaps.append(gap)
        
        # Calculate coverage
        total_files = len(code_files)
        coverage_percentage = (documented_count / total_files * 100) if total_files > 0 else 100
        
        # Create report
        self.coverage_report = CoverageReport(
            total_files=total_files,
            documented_files=documented_count,
            missing_docs=len(gaps),
            coverage_percentage=coverage_percentage,
            gaps=gaps,
            timestamp=datetime.now().isoformat()
        )
        
        return self.coverage_report

    def generate_report(self, format: str = "console") -> str:
        """Generate coverage report in specified format"""
        if not self.coverage_report:
            raise ValueError("No coverage report available. Run check_coverage() first.")
            
        report = self.coverage_report
        
        if format == "console":
            return self._generate_console_report(report)
        elif format == "json":
            return json.dumps(asdict(report), indent=2)
        elif format == "markdown":
            return self._generate_markdown_report(report)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _generate_console_report(self, report: CoverageReport) -> str:
        """Generate console-friendly report"""
        output = []
        
        # Header
        output.append("=" * 80)
        output.append("📊 DOCUMENTATION COVERAGE REPORT")
        output.append("=" * 80)
        output.append("")
        
        # Summary
        status_emoji = "✅" if report.coverage_percentage >= self.config["minimum_coverage"] else "❌"
        output.append(f"{status_emoji} Coverage: {report.coverage_percentage:.1f}% ({report.documented_files}/{report.total_files} files)")
        output.append(f"📝 Missing documentation: {report.missing_docs} files")
        output.append("")
        
        if report.gaps:
            # Group by priority
            high_priority = [g for g in report.gaps if g.priority == "high"]
            medium_priority = [g for g in report.gaps if g.priority == "medium"] 
            low_priority = [g for g in report.gaps if g.priority == "low"]
            
            if high_priority:
                output.append("🚨 HIGH PRIORITY - Missing Documentation:")
                for gap in high_priority:
                    output.append(f"  ❌ {gap.file_path}")
                    output.append(f"     → Should create: {gap.suggested_doc_path}")
                    output.append(f"     → Reason: {gap.reason}")
                    output.append("")
                    
            if medium_priority:
                output.append("⚠️  MEDIUM PRIORITY - Missing Documentation:")
                for gap in medium_priority:
                    output.append(f"  ⚠️  {gap.file_path}")
                    output.append(f"     → Should create: {gap.suggested_doc_path}")
                    output.append("")
                    
            if low_priority:
                output.append("📝 LOW PRIORITY - Missing Documentation:")
                for gap in low_priority:
                    output.append(f"  📝 {gap.file_path}")
                    output.append(f"     → Should create: {gap.suggested_doc_path}")
                    output.append("")
        
        output.append("=" * 80)
        return "\n".join(output)

    def _generate_markdown_report(self, report: CoverageReport) -> str:
        """Generate markdown report for GitHub/Jekyll"""
        output = []
        
        output.append("# Documentation Coverage Report")
        output.append("")
        output.append(f"**Generated:** {report.timestamp}")
        output.append(f"**Coverage:** {report.coverage_percentage:.1f}% ({report.documented_files}/{report.total_files} files)")
        output.append("")
        
        if report.gaps:
            output.append("## Missing Documentation")
            output.append("")
            
            # Group by priority
            for priority in ["high", "medium", "low"]:
                priority_gaps = [g for g in report.gaps if g.priority == priority]
                if priority_gaps:
                    output.append(f"### {priority.title()} Priority")
                    output.append("")
                    for gap in priority_gaps:
                        output.append(f"- **{gap.file_name}** (`{gap.file_path}`)")
                        output.append(f"  - Suggested location: `{gap.suggested_doc_path}`")
                        output.append(f"  - Type: {gap.file_type}")
                        output.append("")
        
        return "\n".join(output)

    def generate_stubs(self) -> int:
        """Generate documentation stub files for missing docs"""
        if not self.coverage_report or not self.config["generate_stubs"]:
            return 0
            
        created_count = 0
        
        for gap in self.coverage_report.gaps:
            stub_path = gap.suggested_doc_path
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(stub_path), exist_ok=True)
            
            # Don't overwrite existing files
            if os.path.exists(stub_path):
                continue
                
            # Generate stub content
            stub_content = self._generate_stub_content(gap)
            
            try:
                with open(stub_path, 'w') as f:
                    f.write(stub_content)
                print(f"📝 Created documentation stub: {stub_path}")
                created_count += 1
            except Exception as e:
                print(f"❌ Failed to create {stub_path}: {e}")
                
        return created_count

    def _generate_stub_content(self, gap: DocumentationGap) -> str:
        """Generate content for documentation stub"""
        return f"""---
title: {gap.file_name}
category: {gap.file_type}
tags: [documentation-needed]
status: draft
---

# {gap.file_name}

> ⚠️ **Documentation Needed**: This file was automatically generated and needs content.

## Overview

TODO: Describe what this {gap.file_type} does.

## Usage

TODO: Provide usage examples.

## API Reference

TODO: Document the public interface.

---

*File: `{gap.file_path}`*  
*Auto-generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Check documentation coverage")
    parser.add_argument("--config", default="scripts/docs-coverage.json", help="Config file path")
    parser.add_argument("--format", choices=["console", "json", "markdown"], default="console", help="Output format")
    parser.add_argument("--output", help="Output file (default: stdout)")
    parser.add_argument("--generate-stubs", action="store_true", help="Generate documentation stubs")
    parser.add_argument("--fail-under", type=float, help="Fail if coverage is under this percentage")
    
    args = parser.parse_args()
    
    # Create enforcer
    enforcer = DocumentationCoverageEnforcer(args.config)
    
    # Override minimum coverage if specified
    if args.fail_under:
        enforcer.config["minimum_coverage"] = args.fail_under
    
    # Check coverage
    report = enforcer.check_coverage()
    
    # Generate report
    output = enforcer.generate_report(args.format)
    
    # Write output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"📄 Report written to {args.output}")
    else:
        print(output)
    
    # Generate stubs if requested
    if args.generate_stubs:
        created = enforcer.generate_stubs()
        print(f"📝 Created {created} documentation stubs")
    
    # Exit with appropriate code
    if report.coverage_percentage < enforcer.config["minimum_coverage"]:
        print(f"\n❌ Coverage {report.coverage_percentage:.1f}% is below minimum {enforcer.config['minimum_coverage']}%")
        sys.exit(1)
    else:
        print(f"\n✅ Coverage {report.coverage_percentage:.1f}% meets minimum requirement")
        sys.exit(0)

if __name__ == "__main__":
    main() 