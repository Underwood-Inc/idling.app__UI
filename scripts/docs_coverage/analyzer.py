#!/usr/bin/env python3
"""
Code analysis module for TypeScript/JavaScript files
"""

import os
import sys
import glob
import re
from pathlib import Path
from typing import List, Dict

from .models import CodeFileAnalysis
from .config import ConfigManager

class CodeAnalyzer:
    """Analyzes TypeScript/JavaScript code files for documentation requirements"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config = config_manager.config
    
    def find_code_files(self) -> List[CodeFileAnalysis]:
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
        path_lower = file_path.lower()
        
        if "components" in path_lower:
            return "component"
        elif "services" in path_lower:
            return "service"
        elif "utils" in path_lower:
            return "utility"
        elif "hooks" in path_lower:
            return "hook"
        elif "api" in path_lower and "route" in path_lower:
            return "api_route"
        elif "middleware" in path_lower:
            return "middleware"
        elif "types" in path_lower:
            return "types"
        elif "page.tsx" in path_lower:
            return "page"
        elif "layout.tsx" in path_lower:
            return "layout"
        elif "loading.tsx" in path_lower:
            return "loading"
        elif "error.tsx" in path_lower:
            return "error"
        elif "not-found.tsx" in path_lower:
            return "not_found"
        elif "globals.tsx" in path_lower:
            return "globals"
        elif "constants" in path_lower:
            return "constants"
        elif "templates" in path_lower:
            return "template"
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
        if file_type in ["service", "component", "hook", "page", "layout"]:
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
        
        if file_type in ["component", "page", "layout"] and size_lines > 300:
            return "critical"
        
        if complexity > self.config["code_analysis"]["complexity_thresholds"]["high"]:
            return "critical"
        
        # High: Public APIs and substantial code files
        if file_type in ["component", "service", "page", "layout"] and size_lines > 150:
            return "high"
        
        if complexity > self.config["code_analysis"]["complexity_thresholds"]["medium"]:
            return "high"
        
        if is_public and file_type in ["api_route", "service"] and complexity > 15:
            return "high"
        
        # Medium: Hooks, utilities, and smaller components
        if file_type in ["hook", "utility", "template"] and is_public:
            return "medium"
        
        if file_type in ["component", "page"] and size_lines > 50:
            return "medium"
        
        return "low" 