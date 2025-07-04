#!/usr/bin/env python3
"""
Documentation coverage analysis package
"""

from .checker import DocumentationChecker
from .config import ConfigManager
from .analyzer import CodeAnalyzer
from .quality import QualityAssessor
from .models import (
    DocumentationQuality,
    CodeFileAnalysis,
    DocumentationGap,
    CoverageReport
)

__version__ = "2.0.0"
__all__ = [
    'DocumentationChecker',
    'ConfigManager',
    'CodeAnalyzer',
    'QualityAssessor',
    'DocumentationQuality',
    'CodeFileAnalysis',
    'DocumentationGap',
    'CoverageReport'
] 