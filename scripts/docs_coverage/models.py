#!/usr/bin/env python3
"""
Data models for documentation coverage analysis
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
from datetime import datetime

@dataclass
class DocumentationQuality:
    """Represents the quality metrics of a documentation file"""
    has_overview: bool = False
    has_usage_examples: bool = False
    has_api_documentation: bool = False
    has_installation_guide: bool = False
    has_configuration_docs: bool = False
    has_troubleshooting: bool = False
    has_code_examples: bool = False
    has_proper_headings: bool = False
    word_count: int = 0
    line_count: int = 0
    quality_score: float = 0.0
    missing_sections: Optional[List[str]] = None
    
    def __post_init__(self):
        if self.missing_sections is None:
            self.missing_sections = []

@dataclass
class CodeFileAnalysis:
    """Analysis of a code file that needs documentation"""
    path: str
    name: str
    file_type: str
    language: str
    size_lines: int
    complexity_score: int
    exported_functions: List[str]
    exported_classes: List[str]
    exported_types: List[str]
    exported_constants: List[str]
    has_tests: bool
    is_public_api: bool
    documentation_required: bool
    priority: str  # 'critical', 'high', 'medium', 'low'

@dataclass
class DocumentationGap:
    """Represents missing or inadequate documentation"""
    code_file: str
    expected_doc_path: str
    gap_type: str  # 'missing', 'inadequate', 'outdated'
    priority: str
    required_sections: List[str]
    quality_issues: List[str]
    estimated_effort: str  # 'low', 'medium', 'high'

@dataclass
class CoverageReport:
    """Comprehensive documentation coverage report"""
    total_code_files: int
    documented_files: int
    adequately_documented: int
    missing_documentation: int
    inadequate_documentation: int
    coverage_percentage: float
    quality_score: float
    gaps: List[DocumentationGap]
    by_priority: Dict[str, int]
    by_file_type: Dict[str, Dict[str, int]]
    timestamp: str

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return asdict(self) 