#!/usr/bin/env python3
"""
Simple Documentation Coverage Report Generator
Usage: python3 scripts/docs-coverage.py [--syntax-highlighting]
"""

import sys
import os
import argparse
from pathlib import Path

# Add scripts directory to path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

def main():
    """Generate documentation coverage report."""
    parser = argparse.ArgumentParser(description="Generate documentation coverage report")
    parser.add_argument('--syntax-highlighting', action='store_true', 
                       help='Enable syntax highlighting in source code previews (slower but prettier)')
    args = parser.parse_args()
    
    try:
        from docs_coverage.checker import DocumentationChecker
        
        print("🔍 Running documentation coverage analysis...")
        checker = DocumentationChecker()
        
        # Enable syntax highlighting if requested
        if args.syntax_highlighting:
            print("🎨 Syntax highlighting enabled (this will take longer...)")
            checker.reporters['html'] = checker.reporters['html'].__class__(
                checker.config_manager, enable_syntax_highlighting=True
            )
        
        report = checker.check_coverage()
        
        # Generate HTML report
        html_content = checker.generate_report(report, 'html')
        
        print(f"✅ HTML report generated: documentation-coverage-report.html")
        print(f"📊 Coverage: {report.coverage_percentage:.1f}% ({report.adequately_documented}/{report.total_code_files} files)")
        print(f"📚 Documentation files: {len(checker.documentation_files)}")
        print(f"🔍 Gaps found: {len(report.gaps)}")
        print(f"🌐 Open the HTML file in your browser to view the interactive report!")
        
        if args.syntax_highlighting:
            print("🎨 Report includes syntax-highlighted source code previews!")
        else:
            print("💡 Tip: Use --syntax-highlighting for prettier code previews (slower)")
        
    except ImportError as e:
        print(f"❌ Error: Could not import documentation checker: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 