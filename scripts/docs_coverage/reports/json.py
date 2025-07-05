#!/usr/bin/env python3
"""
JSON report generator for documentation coverage analysis
"""

import json
from dataclasses import asdict
from ..models import CoverageReport
from ..config import ConfigManager

class JsonReporter:
    """Generates JSON reports for API integration"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager.config
        self.pr_context = None
    
    def set_pr_context(self, pr_context: dict) -> None:
        """Set PR context for the reporter."""
        self.pr_context = pr_context
    
    def generate(self, report: CoverageReport) -> str:
        """Generate JSON report"""
        return json.dumps(asdict(report), indent=2, default=str) 