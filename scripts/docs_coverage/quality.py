#!/usr/bin/env python3
"""
Documentation quality assessment module
"""

import os
import sys
import re
from typing import Dict, List

from .models import DocumentationQuality, CodeFileAnalysis
from .config import ConfigManager

class QualityAssessor:
    """Assesses documentation quality using industry standards"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager.config
    
    def find_documentation_files(self, code_files: List[CodeFileAnalysis]) -> Dict[str, str]:
        """Find all documentation files and map them to code files"""
        doc_files = {}
        
        # Find co-located documentation (preferred for Jekyll)
        for code_file in code_files:
            file_dir = os.path.dirname(code_file.path)
            
            # Check for co-located documentation in priority order
            for doc_pattern in self.config["documentation_discovery"]["co_located_patterns"]:
                doc_path = os.path.join(file_dir, doc_pattern)
                if os.path.exists(doc_path) and self._is_meaningful_documentation(doc_path):
                    doc_files[code_file.path] = doc_path
                    break
        
        return doc_files
    
    def _is_meaningful_documentation(self, doc_path: str) -> bool:
        """Check if documentation file has meaningful content (not just stub/placeholder)"""
        try:
            with open(doc_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
        except Exception:
            return False
        
        # Must have minimum content
        if len(content) < 50:
            return False
        
        # Check for completely empty stub patterns (these should be excluded)
        empty_stub_patterns = [
            r'^\s*TODO\s*:?\s*$',
            r'^\s*STUB\s*:?\s*$',
            r'^\s*Coming soon\s*\.?\s*$',
            r'^\s*Documentation\s+coming\s+soon\s*\.?\s*$',
            r'^\s*Placeholder\s*\.?\s*$',
            r'^\s*TBD\s*\.?\s*$',
            r'^\s*WIP\s*\.?\s*$',
        ]
        
        # Check if content is just a simple stub without structure
        for pattern in empty_stub_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                return False
        
        # Special handling for auto-generated files with structure
        # If it contains "Documentation Needed" but has proper headings, include it
        has_headings = bool(re.search(r'##?\s+\w+', content))
        has_substantial_content = len(content.split()) > 20
        
        # Auto-generated files with proper structure should be included as inadequate docs
        if re.search(r'Documentation Needed.*This file was automatically generated', content, re.IGNORECASE):
            # Include if it has proper structure (headings and reasonable content)
            return has_headings and has_substantial_content
        
        # For other files, require headings or substantial content
        return has_headings or has_substantial_content
    
    def assess_documentation_quality(self, doc_path: str, file_type: str, 
                                   priority: str) -> DocumentationQuality:
        """Assess the quality of documentation using industry standards"""
        try:
            with open(doc_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"⚠️  Error reading {doc_path}: {e}", file=sys.stderr)
            return DocumentationQuality()
        
        # Basic metrics
        word_count = len(content.split())
        line_count = len(content.splitlines())
        
        quality = DocumentationQuality(
            word_count=word_count,
            line_count=line_count
        )
        
        # Check for overview/description
        quality.has_overview = bool(re.search(r'##?\s*(Overview|Description|About)', content, re.IGNORECASE))
        
        # Check for usage examples
        quality.has_usage_examples = bool(re.search(r'##?\s*(Usage|Examples?|Getting Started)', content, re.IGNORECASE))
        
        # Check for API documentation
        quality.has_api_documentation = bool(re.search(r'##?\s*(API|Reference|Methods?|Props?)', content, re.IGNORECASE))
        
        # Check for installation guide
        quality.has_installation_guide = bool(re.search(r'##?\s*(Installation|Setup|Getting Started)', content, re.IGNORECASE))
        
        # Check for configuration docs
        quality.has_configuration_docs = bool(re.search(r'##?\s*(Configuration|Config|Options)', content, re.IGNORECASE))
        
        # Check for troubleshooting
        quality.has_troubleshooting = bool(re.search(r'##?\s*(Troubleshooting|FAQ|Common Issues)', content, re.IGNORECASE))
        
        # Check for code examples
        quality.has_code_examples = bool(re.search(r'```', content))
        
        # Check for proper heading structure
        quality.has_proper_headings = bool(re.search(r'##?\s+\w+', content))
        
        # Calculate quality score
        quality.quality_score = self._calculate_quality_score(quality, file_type, priority)
        
        # Identify missing sections
        required_sections = self.config["documentation_standards"]["required_sections"].get(file_type, [])
        quality.missing_sections = self._identify_missing_sections(content, required_sections)
        
        return quality
    
    def _calculate_quality_score(self, quality: DocumentationQuality, 
                               file_type: str, priority: str) -> float:
        """Calculate documentation quality score (0.0 to 1.0)"""
        score = 0.0
        total_weight = 0.0
        
        # Required sections based on file type
        required_sections = self.config["documentation_standards"]["required_sections"].get(file_type, [])
        
        # Weight different aspects
        weights = {
            "overview": 0.2,
            "usage": 0.25,
            "api_reference": 0.2,
            "examples": 0.15,
            "code_examples": 0.1,
            "proper_headings": 0.1
        }
        
        # Check each weighted aspect
        if "overview" in required_sections:
            total_weight += weights["overview"]
            if quality.has_overview:
                score += weights["overview"]
        
        if "usage" in required_sections:
            total_weight += weights["usage"]
            if quality.has_usage_examples:
                score += weights["usage"]
        
        if "api_reference" in required_sections:
            total_weight += weights["api_reference"]
            if quality.has_api_documentation:
                score += weights["api_reference"]
        
        if "examples" in required_sections:
            total_weight += weights["examples"]
            if quality.has_code_examples:
                score += weights["examples"]
        
        # Always check for proper structure
        total_weight += weights["proper_headings"]
        if quality.has_proper_headings:
            score += weights["proper_headings"]
        
        # Word count penalty/bonus
        min_words = self.config["documentation_standards"]["minimum_word_count"].get(priority, 50)
        if quality.word_count < min_words:
            score *= (quality.word_count / min_words)  # Penalty for too short
        elif quality.word_count > min_words * 2:
            score = min(score * 1.1, 1.0)  # Small bonus for comprehensive docs
        
        return score / total_weight if total_weight > 0 else 0.0
    
    def _identify_missing_sections(self, content: str, required_sections: List[str]) -> List[str]:
        """Identify missing required sections"""
        missing = []
        
        section_patterns = {
            "overview": r'##?\s*(Overview|Description|About)',
            "usage": r'##?\s*(Usage|Getting Started|How to Use)',
            "api_reference": r'##?\s*(API|Reference|Methods?|Props?)',
            "examples": r'##?\s*(Examples?|Sample Code)',
            "installation": r'##?\s*(Installation|Setup)',
            "configuration": r'##?\s*(Configuration|Config|Options)',
            "troubleshooting": r'##?\s*(Troubleshooting|FAQ|Common Issues)',
            "props": r'##?\s*(Props|Properties|Parameters)'
        }
        
        for section in required_sections:
            pattern = section_patterns.get(section)
            if pattern and not re.search(pattern, content, re.IGNORECASE):
                missing.append(section)
        
        return missing
    
    def get_expected_doc_path(self, code_file: CodeFileAnalysis) -> str:
        """Get the expected documentation path for a code file"""
        file_dir = os.path.dirname(code_file.path)
        # Prefer index.md for Jekyll compatibility
        return os.path.join(file_dir, "index.md")
    
    def estimate_effort(self, quality: DocumentationQuality, code_file: CodeFileAnalysis) -> str:
        """Estimate effort to improve documentation"""
        if quality.quality_score < 0.3:
            return "high"
        elif quality.quality_score < 0.6:
            return "medium"
        else:
            return "low"
    
    def estimate_effort_for_missing(self, code_file: CodeFileAnalysis) -> str:
        """Estimate effort to create missing documentation"""
        if code_file.priority == "critical":
            return "high"
        elif code_file.priority == "high":
            return "medium"
        else:
            return "low" 