#!/usr/bin/env python3
"""
Configuration management for documentation coverage analysis
"""

import os
import sys
import json
from typing import Dict, Any

class ConfigManager:
    """Manages configuration for documentation coverage analysis"""
    
    def __init__(self, config_path: str = "scripts/docs-coverage-config.json"):
        self.config_path = config_path
        self.config = self._load_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration with industry-standard settings"""
        return {
            "documentation_standards": {
                "minimum_quality_score": 0.7,
                "minimum_coverage_percentage": 85.0,
                "required_sections": {
                    "api_route": ["overview", "usage", "api_reference", "examples"],
                    "component": ["overview", "props", "usage", "examples"],
                    "service": ["overview", "usage", "api_reference", "configuration"],
                    "utility": ["overview", "usage", "examples"],
                    "hook": ["overview", "usage", "examples", "api_reference"],
                    "page": ["overview", "usage", "examples"],
                    "layout": ["overview", "usage", "examples"],
                    "types": ["overview", "usage", "examples"]
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
                    "app_components": "src/app/**/components/**/*.tsx",
                    "app_pages": "src/app/**/page.tsx",
                    "app_layouts": "src/app/**/layout.tsx",
                    "app_loading": "src/app/**/loading.tsx",
                    "app_error": "src/app/**/error.tsx",
                    "app_not_found": "src/app/**/not-found.tsx",
                    "app_globals": "src/app/**/globals.tsx",
                    "app_admin": "src/app/admin/**/*.tsx",
                    "app_utils": "src/app/**/utils/**/*.ts",
                    "app_hooks": "src/app/**/hooks/**/*.ts",
                    "app_types": "src/app/**/types/**/*.ts",
                    "app_constants": "src/app/**/constants/**/*.ts",
                    "app_services": "src/app/**/services/**/*.ts",
                    "app_misc_ts": "src/app/**/*.ts",
                    "services": "src/lib/services/**/*.ts",
                    "utilities": "src/lib/utils/**/*.ts",
                    "hooks": "src/lib/hooks/**/*.ts",
                    "types": "src/lib/types/**/*.ts",
                    "lib_components": "src/lib/components/**/*.tsx",
                    "lib_misc": "src/lib/**/*.ts",
                    "api_routes": "src/app/api/**/route.ts",
                    "middleware": "src/middleware/**/*.ts",
                    "templates": "src/templates/**/*.tsx",
                    "template_utils": "src/templates/**/*.ts",
                    "root_files": "src/*.ts",
                    "root_components": "src/*.tsx"
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
                    "jekyll/**/*.md"
                ]
            }
        }
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration with industry-standard defaults"""
        default_config = self._get_default_config()
        
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    user_config = json.load(f)
                # Deep merge configurations
                return self._deep_merge(default_config, user_config)
            else:
                # Create default config
                os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
                with open(self.config_path, 'w') as f:
                    json.dump(default_config, f, indent=2)
                print(f"📝 Created default configuration at {self.config_path}", file=sys.stderr)
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
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set_threshold(self, key: str, value: Any) -> None:
        """Set configuration threshold (for CLI overrides)"""
        if key == "fail_under":
            self.config["documentation_standards"]["minimum_coverage_percentage"] = value
        elif key == "min_quality":
            self.config["documentation_standards"]["minimum_quality_score"] = value
        else:
            # Handle nested keys
            keys = key.split('.')
            current = self.config
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            current[keys[-1]] = value 