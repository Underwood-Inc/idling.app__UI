#!/usr/bin/env python3
"""
Main documentation coverage checker class
"""

import sys
from datetime import datetime
from typing import List, Dict, Any

from .models import CoverageReport, DocumentationGap, CodeFileAnalysis
from .config import ConfigManager
from .analyzer import CodeAnalyzer
from .quality import QualityAssessor
from .reports import ConsoleReporter, JsonReporter, MarkdownReporter, HtmlReporter, CsvReporter

class DocumentationChecker:
    """Main documentation coverage checker"""
    
    def __init__(self, config_path: str = "scripts/docs-coverage-config.json"):
        self.config_manager = ConfigManager(config_path)
        self.analyzer = CodeAnalyzer(self.config_manager)
        self.quality_assessor = QualityAssessor(self.config_manager)
        
        # Initialize reporters
        self.reporters = {
            'console': ConsoleReporter(self.config_manager),
            'json': JsonReporter(self.config_manager),
            'markdown': MarkdownReporter(self.config_manager),
            'html': HtmlReporter(self.config_manager, enable_syntax_highlighting=False),
            'csv': CsvReporter(self.config_manager)
        }
        
        # Data storage
        self.code_files: List[CodeFileAnalysis] = []
        self.documentation_files: Dict[str, str] = {}
        self.quality_assessments: Dict[str, Any] = {}
    
    def check_coverage(self) -> CoverageReport:
        """Perform comprehensive documentation coverage analysis"""
        print("🔍 Performing industry-standard documentation coverage analysis...", file=sys.stderr)
        
        # Find and analyze code files
        self.code_files = self.analyzer.find_code_files()
        print(f"📁 Found {len(self.code_files)} code files requiring documentation", file=sys.stderr)
        
        # Find documentation files
        self.documentation_files = self.quality_assessor.find_documentation_files(self.code_files)
        print(f"📚 Found {len(self.documentation_files)} meaningful documentation files", file=sys.stderr)
        
        # Assess documentation quality
        gaps = []
        adequately_documented = 0
        total_quality_score = 0.0
        
        for code_file in self.code_files:
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
        total_files = len(self.code_files)
        coverage_percentage = (adequately_documented / total_files * 100) if total_files > 0 else 100
        average_quality = (total_quality_score / documented_files) if documented_files > 0 else 0.0
        
        # Group by priority and file type
        by_priority = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        by_file_type = {}
        
        for gap in gaps:
            by_priority[gap.priority] += 1
            
            file_type = next((cf.file_type for cf in self.code_files if cf.path == gap.code_file), "unknown")
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
    
    def generate_report(self, report: CoverageReport, format: str = "console") -> str:
        """Generate comprehensive coverage report"""
        if format not in self.reporters:
            raise ValueError(f"Unsupported format: {format}. Supported formats: {', '.join(self.reporters.keys())}")
        
        reporter = self.reporters[format]
        
        # Set code files for CSV reporter (needed for detailed analysis)
        if format == "csv":
            reporter.set_code_files(self.code_files)
        
        return reporter.generate(report)
    
    def set_threshold(self, key: str, value: Any) -> None:
        """Set configuration threshold (for CLI overrides)"""
        self.config_manager.set_threshold(key, value)
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self.config_manager.get(key, default) 