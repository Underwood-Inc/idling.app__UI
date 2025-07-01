#!/usr/bin/env python3
"""
Update README.md with documentation coverage badges
"""

import re
import os
import sys

def update_readme_badges():
    """Update README.md with current documentation coverage badges"""
    
    # Badge URLs from environment variables
    doc_badge = os.environ.get('DOC_BADGE_URL', '')
    files_badge = os.environ.get('DOC_FILES_BADGE_URL', '')
    docstring_badge = os.environ.get('DOCSTRING_BADGE_URL', '')
    
    if not all([doc_badge, files_badge, docstring_badge]):
        print("❌ Missing badge URL environment variables")
        return False
    
    # Read current README
    if os.path.exists('README.md'):
        with open('README.md', 'r') as f:
            content = f.read()
    else:
        content = "# Idling App UI\n\n"
    
    # Create badges section
    badges_section = f"""## 📊 Project Status

[![Documentation Coverage]({doc_badge})](https://underwood-inc.github.io/idling.app__UI/)
[![Documentation Files]({files_badge})](https://underwood-inc.github.io/idling.app__UI/)
[![Python Docstrings]({docstring_badge})](https://underwood-inc.github.io/idling.app__UI/)

---"""
    
    # Replace existing badges section or add new one
    if '## 📊 Project Status' in content:
        # Replace existing section
        new_content = re.sub(
            r'## 📊 Project Status.*?---',
            badges_section,
            content,
            flags=re.DOTALL
        )
    else:
        # Add badges section after title
        lines = content.split('\n')
        if lines and lines[0].startswith('#'):
            # Insert after title
            lines.insert(1, '')
            lines.insert(2, badges_section)
            lines.insert(3, '')
            new_content = '\n'.join(lines)
        else:
            new_content = badges_section + '\n\n' + content
    
    # Write updated README
    with open('README.md', 'w') as f:
        f.write(new_content)
    
    print("✅ Updated README.md with documentation badges")
    return True

if __name__ == '__main__':
    success = update_readme_badges()
    sys.exit(0 if success else 1) 