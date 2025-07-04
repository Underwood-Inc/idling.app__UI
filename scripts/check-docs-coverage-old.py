#!/usr/bin/env python3
"""
Industry-Standard Documentation Coverage Enforcer
Validates documentation quality using industry best practices for co-located Jekyll documentation
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
import argparse

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

class IndustryStandardDocumentationChecker:
    """Industry-standard documentation coverage checker with Jekyll co-location support"""
    
    def __init__(self, config_path: str = "scripts/docs-coverage-config.json"):
        self.config = self._load_config(config_path)
        self.code_files: List[CodeFileAnalysis] = []
        self.documentation_files: Dict[str, str] = {}
        self.quality_assessments: Dict[str, DocumentationQuality] = {}
        
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration with industry-standard defaults"""
        default_config = {
            "documentation_standards": {
                "minimum_quality_score": 0.7,
                "minimum_coverage_percentage": 85.0,
                "required_sections": {
                    "api_route": ["overview", "usage", "api_reference", "examples"],
                    "component": ["overview", "props", "usage", "examples"],
                    "service": ["overview", "usage", "api_reference", "configuration"],
                    "utility": ["overview", "usage", "examples"],
                    "hook": ["overview", "usage", "examples", "api_reference"]
                },
                "minimum_word_count": {
                    "critical": 200,
                    "high": 150,
                    "medium": 100,
                    "low": 50
                }
            },
            "code_analysis": {
                "file_patterns": {
                    "components": "src/components/**/*.tsx",
                    "services": "src/lib/services/**/*.ts",
                    "utilities": "src/lib/utils/**/*.ts",
                    "hooks": "src/lib/hooks/**/*.ts",
                    "api_routes": "src/app/api/**/route.ts",
                    "middleware": "src/middleware/**/*.ts",
                    "types": "src/lib/types/**/*.ts"
                },
                "exclude_patterns": [
                    "**/*.test.*",
                    "**/*.spec.*",
                    "**/test/**",
                    "**/__tests__/**",
                    "**/node_modules/**",
                    "**/.next/**",
                    "**/build/**",
                    "**/dist/**"
                ],
                "complexity_thresholds": {
                    "low": 10,
                    "medium": 25,
                    "high": 50,
                    "critical": 100
                }
            },
            "documentation_discovery": {
                "co_located_patterns": [
                    "index.md",
                    "README.md",
                    "docs.md",
                    "documentation.md"
                ],
                "centralized_patterns": [
                    "docs/**/*.md",
                    "jekyll/**/*.md"
                ]
            }
        }
        
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                # Deep merge configurations
                return self._deep_merge(default_config, user_config)
            else:
                # Create default config
                os.makedirs(os.path.dirname(config_path), exist_ok=True)
                with open(config_path, 'w') as f:
                    json.dump(default_config, f, indent=2)
                print(f"📝 Created default configuration at {config_path}", file=sys.stderr)
                return default_config
        except Exception as e:
            print(f"⚠️  Error loading config: {e}", file=sys.stderr)
            return default_config
    
    def _deep_merge(self, base: Dict, update: Dict) -> Dict:
        """Deep merge two dictionaries"""
        result = base.copy()
        for key, value in update.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result
    
    def _analyze_typescript_file(self, file_path: str) -> CodeFileAnalysis:
        """Analyze a TypeScript/TSX file for documentation requirements"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}", file=sys.stderr)
            return self._create_basic_analysis(file_path)
        
        # Basic file info
        path_obj = Path(file_path)
        name = path_obj.stem
        file_type = self._determine_file_type(file_path)
        language = "typescript" if file_path.endswith('.ts') else "tsx"
        size_lines = len(content.splitlines())
        
        # Extract exports using regex (more reliable than AST for TS/TSX)
        exported_functions = self._extract_exported_functions(content)
        exported_classes = self._extract_exported_classes(content)
        exported_types = self._extract_exported_types(content)
        exported_constants = self._extract_exported_constants(content)
        
        # Calculate complexity score
        complexity_score = self._calculate_complexity(content)
        
        # Check for tests
        test_patterns = [f"{name}.test.", f"{name}.spec.", f"__tests__/{name}"]
        has_tests = any(
            os.path.exists(file_path.replace(name + path_obj.suffix, pattern))
            for pattern in test_patterns
        )
        
        # Determine if this is a public API
        is_public_api = self._is_public_api(file_path, content)
        
        # Determine documentation requirements
        documentation_required = self._requires_documentation(
            file_type, complexity_score, exported_functions, exported_classes, is_public_api
        )
        
        # Determine priority
        priority = self._determine_priority(
            file_type, complexity_score, is_public_api, size_lines
        )
        
        return CodeFileAnalysis(
            path=file_path,
            name=name,
            file_type=file_type,
            language=language,
            size_lines=size_lines,
            complexity_score=complexity_score,
            exported_functions=exported_functions,
            exported_classes=exported_classes,
            exported_types=exported_types,
            exported_constants=exported_constants,
            has_tests=has_tests,
            is_public_api=is_public_api,
            documentation_required=documentation_required,
            priority=priority
        )
    
    def _create_basic_analysis(self, file_path: str) -> CodeFileAnalysis:
        """Create basic analysis when file cannot be read"""
        path_obj = Path(file_path)
        return CodeFileAnalysis(
            path=file_path,
            name=path_obj.stem,
            file_type=self._determine_file_type(file_path),
            language="unknown",
            size_lines=0,
            complexity_score=0,
            exported_functions=[],
            exported_classes=[],
            exported_types=[],
            exported_constants=[],
            has_tests=False,
            is_public_api=False,
            documentation_required=False,
            priority="low"
        )
    
    def _determine_file_type(self, file_path: str) -> str:
        """Determine the type of code file"""
        if "components" in file_path:
            return "component"
        elif "services" in file_path:
            return "service"
        elif "utils" in file_path:
            return "utility"
        elif "hooks" in file_path:
            return "hook"
        elif "api" in file_path and "route" in file_path:
            return "api_route"
        elif "middleware" in file_path:
            return "middleware"
        elif "types" in file_path:
            return "types"
        else:
            return "unknown"
    
    def _extract_exported_functions(self, content: str) -> List[str]:
        """Extract exported function names"""
        patterns = [
            r'export\s+(?:async\s+)?function\s+(\w+)',
            r'export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(',
            r'export\s+const\s+(\w+)\s*:\s*[^=]*=\s*(?:async\s+)?\(',
        ]
        
        functions = []
        for pattern in patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            functions.extend(matches)
        
        return list(set(functions))
    
    def _extract_exported_classes(self, content: str) -> List[str]:
        """Extract exported class names"""
        patterns = [
            r'export\s+class\s+(\w+)',
            r'export\s+abstract\s+class\s+(\w+)',
        ]
        
        classes = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            classes.extend(matches)
        
        return list(set(classes))
    
    def _extract_exported_types(self, content: str) -> List[str]:
        """Extract exported type and interface names"""
        patterns = [
            r'export\s+type\s+(\w+)',
            r'export\s+interface\s+(\w+)',
            r'export\s+enum\s+(\w+)',
        ]
        
        types = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            types.extend(matches)
        
        return list(set(types))
    
    def _extract_exported_constants(self, content: str) -> List[str]:
        """Extract exported constant names"""
        patterns = [
            r'export\s+const\s+(\w+)\s*=\s*[^(]',  # Constants (not functions)
        ]
        
        constants = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            constants.extend(matches)
        
        return list(set(constants))
    
    def _calculate_complexity(self, content: str) -> int:
        """Calculate cyclomatic complexity score"""
        complexity_indicators = [
            r'\bif\b',
            r'\belse\b',
            r'\bfor\b',
            r'\bwhile\b',
            r'\bswitch\b',
            r'\bcase\b',
            r'\btry\b',
            r'\bcatch\b',
            r'\bfinally\b',
            r'\?\s*:',  # Ternary operator
            r'&&',
            r'\|\|',
        ]
        
        complexity = 1  # Base complexity
        for indicator in complexity_indicators:
            complexity += len(re.findall(indicator, content))
        
        return complexity
    
    def _is_public_api(self, file_path: str, content: str) -> bool:
        """Determine if this file is part of the public API"""
        # Check for public API indicators
        public_indicators = [
            "export" in content,
            "api" in file_path.lower(),
            "public" in file_path.lower(),
            not file_path.startswith("src/lib/internal/"),
            not "_internal" in file_path,
            not ".internal." in file_path,
        ]
        
        return sum(public_indicators) >= 2
    
    def _requires_documentation(self, file_type: str, complexity: int, 
                               functions: List[str], classes: List[str], 
                               is_public: bool) -> bool:
        """Determine if a file requires documentation"""
        # Skip simple API route files (Next.js auto-generated routes)
        if file_type == "api_route":
            # Only require docs for complex API routes with multiple functions or high complexity
            if complexity < 15 and len(functions) <= 2 and len(classes) == 0:
                return False
        
        # Always require docs for public APIs (except simple routes)
        if is_public and file_type in ["service", "component"]:
            return True
        
        # Require docs for complex files
        if complexity > self.config["code_analysis"]["complexity_thresholds"]["medium"]:
            return True
        
        # Require docs for files with multiple exports
        if len(functions) + len(classes) > 3:
            return True
        
        # Require docs for specific file types (but not simple utilities)
        if file_type in ["service", "component", "hook"]:
            return True
        
        # Require docs for complex utilities
        if file_type == "utility" and (complexity > 20 or len(functions) > 2):
            return True
        
        return False
    
    def _determine_priority(self, file_type: str, complexity: int, 
                          is_public: bool, size_lines: int) -> str:
        """Determine documentation priority"""
        # Critical: Complex public services and large components
        if is_public and file_type == "service" and complexity > 30:
            return "critical"
        
        if file_type == "component" and size_lines > 300:
            return "critical"
        
        if complexity > self.config["code_analysis"]["complexity_thresholds"]["high"]:
            return "critical"
        
        # High: Public APIs and substantial code files
        if file_type in ["component", "service"] and size_lines > 150:
            return "high"
        
        if complexity > self.config["code_analysis"]["complexity_thresholds"]["medium"]:
            return "high"
        
        if is_public and file_type in ["api_route", "service"] and complexity > 15:
            return "high"
        
        # Medium: Hooks, utilities, and smaller components
        if file_type in ["hook", "utility"] and is_public:
            return "medium"
        
        if file_type == "component" and size_lines > 50:
            return "medium"
        
        return "low"
    
    def _find_code_files(self) -> List[CodeFileAnalysis]:
        """Find and analyze all code files"""
        code_files = []
        
        for file_type, pattern in self.config["code_analysis"]["file_patterns"].items():
            files = glob.glob(pattern, recursive=True)
            for file_path in files:
                if self._should_exclude_file(file_path):
                    continue
                
                analysis = self._analyze_typescript_file(file_path)
                if analysis.documentation_required:
                    code_files.append(analysis)
        
        return code_files
    
    def _should_exclude_file(self, file_path: str) -> bool:
        """Check if file should be excluded from analysis"""
        for pattern in self.config["code_analysis"]["exclude_patterns"]:
            if pattern.replace("**", "").replace("*", "") in file_path:
                return True
        return False
    
    def _find_documentation_files(self) -> Dict[str, str]:
        """Find all documentation files and map them to code files"""
        doc_files = {}
        
        # Find co-located documentation (preferred for Jekyll)
        for code_file in self.code_files:
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
        
        # Check for stub patterns
        stub_patterns = [
            r'^\s*TODO\s*:?\s*$',
            r'^\s*STUB\s*:?\s*$',
            r'^\s*Coming soon\s*\.?\s*$',
            r'^\s*Documentation\s+coming\s+soon\s*\.?\s*$',
            r'^\s*Placeholder\s*\.?\s*$',
            r'^\s*TBD\s*\.?\s*$',
            r'^\s*WIP\s*\.?\s*$',
            r'Documentation Needed.*This file was automatically generated',
        ]
        
        for pattern in stub_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                return False
        
        # Must have at least one heading or substantial content
        has_headings = bool(re.search(r'##?\s+\w+', content))
        has_substantial_content = len(content.split()) > 20
        
        return has_headings or has_substantial_content
    
    def _assess_documentation_quality(self, doc_path: str, file_type: str, 
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
            "troubleshooting": r'##?\s*(Troubleshooting|FAQ|Common Issues)'
        }
        
        for section in required_sections:
            pattern = section_patterns.get(section)
            if pattern and not re.search(pattern, content, re.IGNORECASE):
                missing.append(section)
        
        return missing
    
    def check_coverage(self) -> CoverageReport:
        """Perform comprehensive documentation coverage analysis"""
        print("🔍 Performing industry-standard documentation coverage analysis...", file=sys.stderr)
        
        # Find and analyze code files
        self.code_files = self._find_code_files()
        print(f"📁 Found {len(self.code_files)} code files requiring documentation", file=sys.stderr)
        
        # Find documentation files
        self.documentation_files = self._find_documentation_files()
        print(f"📚 Found {len(self.documentation_files)} meaningful documentation files", file=sys.stderr)
        
        # Assess documentation quality
        gaps = []
        adequately_documented = 0
        total_quality_score = 0.0
        
        for code_file in self.code_files:
            if code_file.path in self.documentation_files:
                doc_path = self.documentation_files[code_file.path]
                quality = self._assess_documentation_quality(doc_path, code_file.file_type, code_file.priority)
                self.quality_assessments[code_file.path] = quality
                
                min_quality = self.config["documentation_standards"]["minimum_quality_score"]
                if quality.quality_score >= min_quality:
                    adequately_documented += 1
                else:
                    # Documentation exists but is inadequate
                    gap = DocumentationGap(
                        code_file=code_file.path,
                        expected_doc_path=doc_path,
                        gap_type="inadequate",
                        priority=code_file.priority,
                        required_sections=self.config["documentation_standards"]["required_sections"].get(code_file.file_type, []),
                        quality_issues=quality.missing_sections or [],
                        estimated_effort=self._estimate_effort(quality, code_file)
                    )
                    gaps.append(gap)
                
                total_quality_score += quality.quality_score
            else:
                # Documentation is missing
                expected_doc_path = self._get_expected_doc_path(code_file)
                gap = DocumentationGap(
                    code_file=code_file.path,
                    expected_doc_path=expected_doc_path,
                    gap_type="missing",
                    priority=code_file.priority,
                    required_sections=self.config["documentation_standards"]["required_sections"].get(code_file.file_type, []),
                    quality_issues=["Documentation file does not exist"],
                    estimated_effort=self._estimate_effort_for_missing(code_file)
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
    
    def _get_expected_doc_path(self, code_file: CodeFileAnalysis) -> str:
        """Get the expected documentation path for a code file"""
        file_dir = os.path.dirname(code_file.path)
        # Prefer index.md for Jekyll compatibility
        return os.path.join(file_dir, "index.md")
    
    def _estimate_effort(self, quality: DocumentationQuality, code_file: CodeFileAnalysis) -> str:
        """Estimate effort to improve documentation"""
        if quality.quality_score < 0.3:
            return "high"
        elif quality.quality_score < 0.6:
            return "medium"
        else:
            return "low"
    
    def _estimate_effort_for_missing(self, code_file: CodeFileAnalysis) -> str:
        """Estimate effort to create missing documentation"""
        if code_file.priority == "critical":
            return "high"
        elif code_file.priority == "high":
            return "medium"
        else:
            return "low"
    
    def generate_report(self, report: CoverageReport, format: str = "console") -> str:
        """Generate comprehensive coverage report"""
        if format == "console":
            return self._generate_console_report(report)
        elif format == "json":
            return json.dumps(asdict(report), indent=2, default=str)
        elif format == "markdown":
            return self._generate_markdown_report(report)
        elif format == "html":
            return self._generate_html_report(report)
        elif format == "csv":
            return self._generate_csv_report(report)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _generate_console_report(self, report: CoverageReport) -> str:
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
    
    def _generate_markdown_report(self, report: CoverageReport) -> str:
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
    
    def _generate_html_report(self, report: CoverageReport) -> str:
        """Generate interactive HTML report"""
        output = []
        
        # HTML header
        output.append("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation Coverage Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .stat-card h3 { color: #495057; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem; }
        .stat-value.success { color: #28a745; }
        .stat-value.warning { color: #ffc107; }
        .stat-value.danger { color: #dc3545; }
        .progress-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.success { background: #28a745; }
        .progress-fill.warning { background: #ffc107; }
        .progress-fill.danger { background: #dc3545; }
        .section { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .section h2 { color: #495057; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .priority-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .priority-card { padding: 1rem; border-radius: 6px; text-align: center; }
        .priority-card.critical { background: #f8d7da; border: 1px solid #f5c6cb; }
        .priority-card.high { background: #fff3cd; border: 1px solid #ffeaa7; }
        .priority-card.medium { background: #d4edda; border: 1px solid #c3e6cb; }
        .priority-card.low { background: #cce5ff; border: 1px solid #99d3ff; }
        .priority-number { font-size: 1.5rem; font-weight: bold; }
        .gap-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .gap-table th, .gap-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }
        .gap-table th { background: #f8f9fa; font-weight: 600; }
        .gap-table tr:hover { background: #f8f9fa; }
        .badge { padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .badge.missing { background: #f8d7da; color: #721c24; }
        .badge.inadequate { background: #fff3cd; color: #856404; }
        .code { background: #f8f9fa; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9rem; }
        .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .filter-tab { padding: 0.5rem 1rem; border: 1px solid #dee2e6; background: white; cursor: pointer; border-radius: 4px; }
        .filter-tab.active { background: #007bff; color: white; border-color: #007bff; }
        .hidden { display: none; }
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .header { padding: 1rem; }
            .header h1 { font-size: 1.8rem; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">""")
        
        # Header
        min_coverage = self.config["documentation_standards"]["minimum_coverage_percentage"]
        coverage_status = "success" if report.coverage_percentage >= min_coverage else "danger"
        quality_status = "success" if report.quality_score >= 0.7 else "warning" if report.quality_score >= 0.5 else "danger"
        
        output.append(f"""
        <div class="header">
            <h1>📊 Documentation Coverage Report</h1>
            <p>Generated: {report.timestamp}</p>
        </div>""")
        
        # Stats grid
        output.append("""
        <div class="stats-grid">""")
        
        # Coverage stat
        output.append(f"""
            <div class="stat-card">
                <h3>Coverage</h3>
                <div class="stat-value {coverage_status}">{report.coverage_percentage:.1f}%</div>
                <div class="progress-bar">
                    <div class="progress-fill {coverage_status}" style="width: {min(report.coverage_percentage, 100)}%"></div>
                </div>
                <small>{report.adequately_documented}/{report.total_code_files} files documented</small>
            </div>""")
        
        # Quality stat
        output.append(f"""
            <div class="stat-card">
                <h3>Quality Score</h3>
                <div class="stat-value {quality_status}">{report.quality_score:.2f}/1.0</div>
                <div class="progress-bar">
                    <div class="progress-fill {quality_status}" style="width: {report.quality_score * 100}%"></div>
                </div>
                <small>Average documentation quality</small>
            </div>""")
        
        # Missing files stat
        output.append(f"""
            <div class="stat-card">
                <h3>Missing Documentation</h3>
                <div class="stat-value danger">{report.missing_documentation}</div>
                <small>Files without documentation</small>
            </div>""")
        
        # Inadequate files stat
        output.append(f"""
            <div class="stat-card">
                <h3>Inadequate Documentation</h3>
                <div class="stat-value warning">{report.inadequate_documentation}</div>
                <small>Files with poor documentation</small>
            </div>""")
        
        output.append("        </div>")
        
        # Priority breakdown
        if any(count > 0 for count in report.by_priority.values()):
            output.append("""
        <div class="section">
            <h2>🎯 Priority Breakdown</h2>
            <div class="priority-grid">""")
            
            priority_info = {
                "critical": {"emoji": "🚨", "desc": "Immediate action required"},
                "high": {"emoji": "⚠️", "desc": "Action needed soon"},
                "medium": {"emoji": "📝", "desc": "Should be documented"},
                "low": {"emoji": "💡", "desc": "Nice to have"}
            }
            
            for priority, count in report.by_priority.items():
                if count > 0:
                    info = priority_info[priority]
                    output.append(f"""
                <div class="priority-card {priority}">
                    <div>{info['emoji']}</div>
                    <div class="priority-number">{count}</div>
                    <div><strong>{priority.title()}</strong></div>
                    <div><small>{info['desc']}</small></div>
                </div>""")
            
            output.append("            </div>\n        </div>")
        
        # Documentation gaps
        if report.gaps:
            output.append("""
        <div class="section">
            <h2>❌ Documentation Gaps</h2>
            <div class="filter-tabs">
                <div class="filter-tab active" onclick="filterGaps('all')">All</div>
                <div class="filter-tab" onclick="filterGaps('critical')">🚨 Critical</div>
                <div class="filter-tab" onclick="filterGaps('high')">⚠️ High</div>
                <div class="filter-tab" onclick="filterGaps('medium')">📝 Medium</div>
                <div class="filter-tab" onclick="filterGaps('low')">💡 Low</div>
            </div>
            <table class="gap-table">
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Expected Doc</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>""")
            
            for gap in report.gaps:
                file_name = gap.code_file.split("/")[-1]
                doc_name = gap.expected_doc_path.split("/")[-1]
                issues = ", ".join(gap.quality_issues[:2])
                if len(gap.quality_issues) > 2:
                    issues += "..."
                
                priority_emoji = {"critical": "🚨", "high": "⚠️", "medium": "📝", "low": "💡"}[gap.priority]
                
                output.append(f"""
                    <tr class="gap-row" data-priority="{gap.priority}">
                        <td><span class="code">{file_name}</span></td>
                        <td><span class="badge {gap.gap_type}">{gap.gap_type.title()}</span></td>
                        <td>{priority_emoji} {gap.priority.title()}</td>
                        <td><span class="code">{doc_name}</span></td>
                        <td>{issues}</td>
                    </tr>""")
            
            output.append("""
                </tbody>
            </table>
        </div>""")
        
        # JavaScript for filtering
        output.append("""
    <script>
        function filterGaps(priority) {
            const rows = document.querySelectorAll('.gap-row');
            const tabs = document.querySelectorAll('.filter-tab');
            
            // Update active tab
            tabs.forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            
            // Filter rows
            rows.forEach(row => {
                if (priority === 'all' || row.dataset.priority === priority) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    </script>""")
        
        # Close HTML
        output.append("""
    </div>
</body>
</html>""")
        
        return "\n".join(output)
    
    def _generate_csv_report(self, report: CoverageReport) -> str:
        """Generate CSV report for Excel/Google Sheets analysis"""
        import csv
        from io import StringIO
        
        output = StringIO()
        
        # Summary section
        writer = csv.writer(output)
        
        # Header with metadata
        writer.writerow(['Documentation Coverage Report'])
        writer.writerow(['Generated', report.timestamp])
        writer.writerow(['Total Code Files', report.total_code_files])
        writer.writerow(['Documented Files', report.documented_files])
        writer.writerow(['Adequately Documented', report.adequately_documented])
        writer.writerow(['Missing Documentation', report.missing_documentation])
        writer.writerow(['Inadequate Documentation', report.inadequate_documentation])
        writer.writerow(['Coverage Percentage', f"{report.coverage_percentage:.1f}%"])
        writer.writerow(['Quality Score', f"{report.quality_score:.2f}/1.0"])
        writer.writerow([])  # Empty row
        
        # Priority breakdown section
        writer.writerow(['Priority Breakdown'])
        writer.writerow(['Priority', 'Count', 'Description'])
        
        priority_descriptions = {
            "critical": "Public APIs, complex services - immediate action required",
            "high": "Core components, important utilities - action needed soon", 
            "medium": "Supporting code, hooks - should be documented",
            "low": "Internal utilities, simple helpers - nice to have"
        }
        
        for priority, count in report.by_priority.items():
            if count > 0:
                desc = priority_descriptions.get(priority, "")
                writer.writerow([priority.title(), count, desc])
        
        writer.writerow([])  # Empty row
        
        # File type breakdown section
        if report.by_file_type:
            writer.writerow(['File Type Breakdown'])
            writer.writerow(['File Type', 'Missing', 'Inadequate', 'Total Issues'])
            
            for file_type, counts in report.by_file_type.items():
                missing = counts.get("missing", 0)
                inadequate = counts.get("inadequate", 0)
                total = missing + inadequate
                writer.writerow([file_type.title(), missing, inadequate, total])
            
            writer.writerow([])  # Empty row
        
        # Detailed gaps section
        if report.gaps:
            writer.writerow(['Documentation Gaps Detail'])
            writer.writerow([
                'File Path', 'File Name', 'Status', 'Priority', 'Expected Doc Path', 
                'File Type', 'Estimated Effort', 'Issues Count', 'Primary Issues'
            ])
            
            for gap in report.gaps:
                file_name = gap.code_file.split("/")[-1]
                doc_name = gap.expected_doc_path.split("/")[-1]
                
                # Determine file type from code files
                file_type = "unknown"
                for code_file in self.code_files:
                    if code_file.path == gap.code_file:
                        file_type = code_file.file_type
                        break
                
                # Get primary issues (first 3)
                primary_issues = "; ".join(gap.quality_issues[:3])
                if len(gap.quality_issues) > 3:
                    primary_issues += f"; +{len(gap.quality_issues) - 3} more"
                
                writer.writerow([
                    gap.code_file,
                    file_name,
                    gap.gap_type.title(),
                    gap.priority.title(),
                    doc_name,
                    file_type.title(),
                    gap.estimated_effort.title(),
                    len(gap.quality_issues),
                    primary_issues
                ])
        
        # Get the CSV content
        csv_content = output.getvalue()
        output.close()
        
        return csv_content

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Industry-standard documentation coverage checker")
    parser.add_argument("--config", default="scripts/docs-coverage-config.json", help="Configuration file")
    parser.add_argument("--format", choices=["console", "json", "markdown", "html", "csv"], default="console", help="Output format")
    parser.add_argument("--output", help="Output file (default: stdout)")
    parser.add_argument("--fail-under", type=float, help="Fail if coverage is under this percentage")
    parser.add_argument("--min-quality", type=float, help="Minimum quality score required")
    
    args = parser.parse_args()
    
    # Create checker
    checker = IndustryStandardDocumentationChecker(args.config)
    
    # Override thresholds if specified
    if args.fail_under:
        checker.config["documentation_standards"]["minimum_coverage_percentage"] = args.fail_under
    if args.min_quality:
        checker.config["documentation_standards"]["minimum_quality_score"] = args.min_quality
    
    # Check coverage
    report = checker.check_coverage()
    
    # Generate report
    output = checker.generate_report(report, args.format)
    
    # Write output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"📄 Report written to {args.output}", file=sys.stderr)
    else:
        print(output)
    
    # Exit with appropriate code
    min_coverage = checker.config["documentation_standards"]["minimum_coverage_percentage"]
    min_quality = checker.config["documentation_standards"]["minimum_quality_score"]
    
    if report.coverage_percentage < min_coverage:
        print(f"\n❌ Coverage {report.coverage_percentage:.1f}% below minimum {min_coverage}%", file=sys.stderr)
        sys.exit(1)
    elif report.quality_score < min_quality:
        print(f"\n❌ Quality score {report.quality_score:.2f} below minimum {min_quality}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"\n✅ Coverage {report.coverage_percentage:.1f}% meets requirements", file=sys.stderr)
        sys.exit(0)

if __name__ == "__main__":
    main() 