#!/bin/bash

# Convert README.md files to index.md for Jekyll compatibility
# Excludes the root README.md file

set -e

echo "🔄 Converting README.md files to index.md for Jekyll compatibility..."

# Find all README.md files except the root one and exclude vendor/node_modules
readme_files=$(find . -name "README.md" -type f | grep -v "^./README.md$" | grep -v "/vendor/" | grep -v "/node_modules/" | grep -v "/.next/")

if [ -z "$readme_files" ]; then
    echo "✅ No README.md files found to convert"
    exit 0
fi

converted_count=0
skipped_count=0

for readme_file in $readme_files; do
    # Get the directory and create index.md path
    dir=$(dirname "$readme_file")
    index_file="$dir/index.md"
    
    echo "📁 Processing: $readme_file"
    
    # Check if index.md already exists
    if [ -f "$index_file" ]; then
        echo "⚠️  $index_file already exists - comparing content..."
        
        # Compare file content (ignoring whitespace differences)
        if cmp -s "$readme_file" "$index_file"; then
            echo "✅ Files are identical - removing duplicate README.md"
            rm "$readme_file"
            converted_count=$((converted_count + 1))
        else
            echo "❌ Files differ - keeping both for manual review"
            echo "   README.md: $(wc -l < "$readme_file") lines"
            echo "   index.md:  $(wc -l < "$index_file") lines"
            skipped_count=$((skipped_count + 1))
        fi
    else
        echo "🔄 Converting $readme_file → $index_file"
        
        # Check if README.md has Jekyll front matter
        if head -n 1 "$readme_file" | grep -q "^---$"; then
            echo "✅ File already has Jekyll front matter - direct conversion"
            mv "$readme_file" "$index_file"
        else
            echo "📝 Adding Jekyll front matter to file"
            
            # Extract title from first heading or filename
            title=$(head -n 10 "$readme_file" | grep -m 1 "^# " | sed 's/^# //' | head -n 1)
            if [ -z "$title" ]; then
                # Use directory name as title
                title=$(basename "$dir" | sed 's/[-_]/ /g' | sed 's/\b\w/\U&/g')
            fi
            
            # Create temporary file with Jekyll front matter
            temp_file=$(mktemp)
            
            # Add Jekyll front matter
            cat > "$temp_file" << EOF
---
title: $title
category: api-documentation
tags: [api, documentation]
---

EOF
            
            # Append original content
            cat "$readme_file" >> "$temp_file"
            
            # Move to final location
            mv "$temp_file" "$index_file"
            rm "$readme_file"
        fi
        
        converted_count=$((converted_count + 1))
    fi
    
    echo ""
done

echo "📊 Conversion Summary:"
echo "   ✅ Converted: $converted_count files"
echo "   ⚠️  Skipped:   $skipped_count files (manual review needed)"
echo ""

if [ $skipped_count -gt 0 ]; then
    echo "⚠️  Manual review needed for files where both README.md and index.md exist with different content"
    echo "   Please review and consolidate these files manually"
fi

echo "✅ README.md to index.md conversion complete!" 