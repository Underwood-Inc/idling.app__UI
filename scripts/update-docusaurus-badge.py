#!/usr/bin/env python3
"""
Update documentation coverage badge in Docusaurus src/index.md
"""

import re
import os
import sys
import argparse
from datetime import datetime


def update_docusaurus_badge(badge_url: str, coverage_percentage: int) -> bool:
    """Update the documentation coverage badge in src/index.md"""
    
    index_file = 'src/index.md'
    
    if not os.path.exists(index_file):
        print(f"❌ {index_file} not found")
        return False
    
    try:
        with open(index_file, 'r') as f:
            content = f.read()
        
        # Pattern to match the documentation coverage badge
        badge_pattern = r'\[!\[Documentation Coverage\]\([^)]+\)\]\([^)]+\)'
        
        # New badge markdown
        new_badge = f'[![Documentation Coverage]({badge_url})](https://underwood-inc.github.io/idling.app__UI/)'
        
        # Check if badge exists
        if re.search(badge_pattern, content):
            # Replace existing badge
            content = re.sub(badge_pattern, new_badge, content)
            print(f"✅ Updated existing documentation coverage badge in {index_file}")
        else:
            # Add badge after the title
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('# '):
                    lines.insert(i + 1, '')
                    lines.insert(i + 2, new_badge)
                    lines.insert(i + 3, '')
                    break
            content = '\n'.join(lines)
            print(f"✅ Added documentation coverage badge to {index_file}")
        
        # Write updated content
        with open(index_file, 'w') as f:
            f.write(content)
        
        print(f"🎯 Badge updated: {coverage_percentage}% coverage")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update {index_file}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Update documentation coverage badge in Docusaurus')
    parser.add_argument('--badge-url', required=True, help='Badge URL from shields.io')
    parser.add_argument('--coverage', type=int, required=True, help='Coverage percentage')
    
    args = parser.parse_args()
    
    success = update_docusaurus_badge(args.badge_url, args.coverage)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main() 