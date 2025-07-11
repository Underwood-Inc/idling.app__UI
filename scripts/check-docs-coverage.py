#!/usr/bin/env python3
"""
Industry-Standard Documentation Coverage Enforcer (Modular Version)
Validates documentation quality using industry best practices for co-located documentation

This is the new modular version that replaces the massive monolithic script.
"""

import sys
import argparse
import os
from docs_coverage import DocumentationChecker

def is_ci_environment():
    """Check if we're running in a CI/CD environment"""
    ci_indicators = [
        'CI', 'CONTINUOUS_INTEGRATION', 'GITHUB_ACTIONS', 'GITLAB_CI',
        'JENKINS_URL', 'BUILDKITE', 'CIRCLECI', 'TRAVIS', 'AZURE_PIPELINES'
    ]
    return any(os.environ.get(indicator) for indicator in ci_indicators)

def prompt_for_format():
    """Interactively prompt user for output format"""
    print("📊 Documentation Coverage Analysis")
    print("=" * 50)
    print()
    print("Available output formats:")
    print("  1. 🖥️  Console (terminal output)")
    print("  2. 🎨 HTML (interactive web report)")
    print("  3. 📊 CSV (spreadsheet data)")
    print("  4. 📝 Markdown (documentation format)")
    print("  5. 📋 JSON (structured data)")
    print()
    
    while True:
        try:
            choice = input("Select format (1-5) [default: 2 for HTML]: ").strip()
            
            # Default to HTML if no choice
            if not choice:
                choice = "2"
            
            format_map = {
                "1": "console",
                "2": "html", 
                "3": "csv",
                "4": "markdown",
                "5": "json"
            }
            
            if choice in format_map:
                selected_format = format_map[choice]
                format_names = {
                    "console": "Console",
                    "html": "HTML", 
                    "csv": "CSV",
                    "markdown": "Markdown",
                    "json": "JSON"
                }
                print(f"✅ Selected: {format_names[selected_format]} format")
                print()
                return selected_format
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Analysis cancelled by user")
            sys.exit(0)
        except EOFError:
            print("\n\n👋 Analysis cancelled")
            sys.exit(0)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Industry-standard documentation coverage checker (modular version)")
    parser.add_argument("--config", default="scripts/docs-coverage-config.json", help="Configuration file")
    parser.add_argument("--format", choices=["console", "json", "markdown", "html", "csv"], help="Output format (prompts if not specified)")
    parser.add_argument("--output", help="Output file (default: stdout for console/json, auto-generated for others)")
    parser.add_argument("--fail-under", type=float, help="Fail if coverage is under this percentage")
    parser.add_argument("--min-quality", type=float, help="Minimum quality score required")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress interactive prompts (use defaults)")
    
    args = parser.parse_args()
    
    # Determine output format
    if args.format:
        # Format specified via argument
        output_format = args.format
    elif args.quiet or is_ci_environment():
        # Use default format in quiet mode or CI environment
        output_format = "html"
        print("🤖 Auto-selected HTML format (CI/quiet mode)", file=sys.stderr)
    else:
        # Interactive mode - prompt for format
        output_format = prompt_for_format()
    
    # Create checker
    print("🔍 Initializing documentation coverage checker...", file=sys.stderr)
    checker = DocumentationChecker(args.config)
    
    # Override thresholds if specified
    if args.fail_under:
        checker.set_threshold("fail_under", args.fail_under)
    if args.min_quality:
        checker.set_threshold("min_quality", args.min_quality)
    
    # Check coverage
    print("📊 Analyzing documentation coverage...", file=sys.stderr)
    report = checker.check_coverage()
    
    # Generate and handle different output formats
    if output_format == "console":
        # Console output goes to terminal
        output = checker.generate_report(report, "console")
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output)
                print(f"📄 Console report written to {args.output}", file=sys.stderr)
        else:
            print(output)
    
    elif output_format in ["html", "csv", "markdown"]:
        # File formats automatically save to files
        print(f"🎨 Generating {output_format.upper()} report...", file=sys.stderr)
        
        # Determine output filename
        if args.output:
            output_file = args.output
            # Set custom output file for reporters that support it
            if output_format == "csv":
                checker.reporters[output_format].set_output_file(output_file)
            elif output_format == "html":
                checker.reporters[output_format].set_output_file(output_file)
        else:
            # Auto-generate filename based on format
            extensions = {"html": "html", "csv": "csv", "markdown": "md"}
            output_file = f"documentation-coverage-report.{extensions[output_format]}"
        
        # Generate the report
        console_summary = checker.generate_report(report, output_format)
        
        # For markdown, handle file writing here since it doesn't have internal file writing
        if output_format == "markdown":
            with open(output_file, 'w', encoding='utf-8') as f:
                # Get the actual markdown content
                markdown_content = checker.reporters["markdown"].generate(report)
                f.write(markdown_content)
        
        # Check if file was created and get its size
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            print(f"✅ {output_format.upper()} report written to {output_file} ({file_size:,} bytes)", file=sys.stderr)
        else:
            print(f"❌ Failed to create {output_file}", file=sys.stderr)
            sys.exit(1)
        
        # Show file location hint
        current_dir = os.getcwd()
        print(f"📍 Location: {os.path.join(current_dir, output_file)}", file=sys.stderr)
        
        # Also show brief console summary (unless quiet mode)
        if not args.quiet:
            print("\n" + "="*60, file=sys.stderr)
            print("📋 QUICK SUMMARY", file=sys.stderr)
            print("="*60, file=sys.stderr)
            # The console_summary returned by these reporters is already a summary
            print(console_summary, file=sys.stderr)
            
            if output_format == "html":
                print(f"\n🌐 Open {output_file} in your browser to explore the interactive report!", file=sys.stderr)
    
    elif output_format == "json":
        # JSON can go to terminal or file
        output = checker.generate_report(report, "json")
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output)
            print(f"📄 JSON report written to {args.output}", file=sys.stderr)
        else:
            print(output)
    
    # Exit with appropriate code
    min_coverage = checker.get_config("documentation_standards.minimum_coverage_percentage", 85.0)
    min_quality = checker.get_config("documentation_standards.minimum_quality_score", 0.7)
    
    # In CI environments, use annotations instead of failing
    if is_ci_environment():
        if report.coverage_percentage < min_coverage:
            print(f"::warning::Documentation coverage {report.coverage_percentage:.1f}% is below minimum {min_coverage}%. Consider adding documentation to improve coverage.", file=sys.stderr)
            print(f"\n⚠️ Coverage {report.coverage_percentage:.1f}% below minimum {min_coverage}% (annotated for CI)", file=sys.stderr)
        elif report.quality_score < min_quality:
            print(f"::warning::Documentation quality score {report.quality_score:.2f} is below minimum {min_quality}. Consider improving documentation quality.", file=sys.stderr)
            print(f"\n⚠️ Quality score {report.quality_score:.2f} below minimum {min_quality} (annotated for CI)", file=sys.stderr)
        else:
            print(f"\n✅ Coverage {report.coverage_percentage:.1f}% meets requirements", file=sys.stderr)
        
        # Always exit successfully in CI to avoid breaking workflows
        sys.exit(0)
    else:
        # In local environments, still fail for strict enforcement
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