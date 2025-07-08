# frozen_string_literal: true

require 'yaml'
require 'fileutils'

module Jekyll
  # Dynamic Navigation Hook - Uses hooks instead of generators to work in safe mode
  class DynamicNavigationHook
    def self.setup(site)
      puts "\n=== DYNAMIC NAVIGATION HOOK ==="
      puts "Jekyll source: #{site.source}"
      
      project_root = File.expand_path('..', site.source)
      puts "Project root: #{project_root}"
      
      # Scan for markdown files with navigation frontmatter
      nav_pages = scan_for_navigation_pages(project_root)
      
      puts "Found #{nav_pages.length} pages with navigation frontmatter:"
      nav_pages.each do |page|
        puts "  - #{page[:title]} (#{page[:parent] || page[:category] || 'root'}) -> #{page[:url]}"
      end
      
      # Build navigation structure
      navigation = build_navigation_structure(nav_pages)
      
      puts "Built navigation with #{navigation.length} top-level items:"
      navigation.each do |item|
        puts "  - #{item[:title]} (#{item[:subnav]&.length || 0} subitems)"
      end
      
      # Store in site data
      site.data ||= {}
      site.data['auto_navigation'] = navigation
      
      puts "Navigation stored in site.data['auto_navigation']"
      puts "=== END NAVIGATION HOOK ===\n"
    end

    private

    def self.scan_for_navigation_pages(project_root)
      nav_pages = []
      
      # Find all markdown files in src/ directory
      src_pattern = File.join(project_root, 'src', '**', '*.md')
      
      puts "Scanning pattern: #{src_pattern}"
      
      Dir.glob(src_pattern).each do |file_path|
        next unless File.file?(file_path)
        
        relative_path = file_path.sub("#{project_root}/", '')
        puts "Processing: #{relative_path}"
        
        begin
          frontmatter = extract_frontmatter(file_path)
          next unless frontmatter
          
          # Check if this file should be included in navigation
          next unless should_include_in_navigation?(frontmatter)
          
          page_data = build_page_data(frontmatter, relative_path)
          nav_pages << page_data
          
          puts "  ✓ Added to navigation: #{page_data[:title]}"
          
        rescue => e
          puts "  ✗ Error processing #{relative_path}: #{e.message}"
        end
      end
      
      nav_pages
    end

    def self.extract_frontmatter(file_path)
      content = File.read(file_path)
      
      # Check for frontmatter
      return nil unless content.match(/\A---\s*\n.*?\n---\s*\n/m)
      
      # Extract and parse frontmatter
      frontmatter_text = content.match(/\A---\s*\n(.*?)\n---\s*\n/m)[1]
      YAML.safe_load(frontmatter_text) || {}
    rescue => e
      puts "    Error parsing YAML: #{e.message}"
      nil
    end

    def self.should_include_in_navigation?(frontmatter)
      # Must have title and either parent, category, or permalink
      has_title = frontmatter['title']
      has_nav_info = frontmatter['parent'] || frontmatter['category'] || frontmatter['permalink']
      
      # Not excluded
      not_excluded = !frontmatter['nav_exclude']
      
      result = has_title && has_nav_info && not_excluded
      
      puts "    Title: #{frontmatter['title']}"
      puts "    Parent: #{frontmatter['parent']}"
      puts "    Category: #{frontmatter['category']}"
      puts "    Permalink: #{frontmatter['permalink']}"
      puts "    Include? #{result}"
      
      result
    end

    def self.build_page_data(frontmatter, relative_path)
      {
        title: frontmatter['title'],
        url: frontmatter['permalink'] || generate_url_from_path(relative_path),
        description: frontmatter['description'],
        parent: frontmatter['parent'],
        category: frontmatter['category'],
        nav_order: frontmatter['nav_order'] || 999,
        file_path: relative_path
      }
    end

    def self.generate_url_from_path(relative_path)
      # Convert src/components/navbar/index.md -> /components/navbar/
      url = relative_path
        .sub(/^src\//, '/') # Remove src/ prefix
        .sub(/\.md$/, '/') # Replace .md with /
        .sub(/\/index\/$/, '/') # Remove /index/ 
      
      url.gsub(/\/+/, '/') # Clean up double slashes
    end

    def self.build_navigation_structure(nav_pages)
      # Group pages by parent/category
      grouped = group_pages_by_parent(nav_pages)
      
      # Build navigation items
      navigation = []
      
      grouped.each do |parent_name, pages|
        if parent_name == 'root'
          # Add root pages directly
          pages.each do |page|
            navigation << {
              title: page[:title],
              url: page[:url],
              description: page[:description]
            }
          end
        else
          # Create parent item with subnav
          parent_page = find_parent_page(pages, parent_name)
          
          navigation << {
            title: parent_name,
            url: parent_page ? parent_page[:url] : "/#{parent_name.downcase.gsub(/\s+/, '-')}/",
            description: parent_page ? parent_page[:description] : "#{parent_name} documentation",
            subnav: pages.sort_by { |p| p[:nav_order] }.map do |page|
              {
                title: page[:title],
                url: page[:url],
                description: page[:description]
              }
            end
          }

        end
      end
      
      # Sort navigation by title
      navigation.sort_by { |item| item[:title] }
    end

    def self.group_pages_by_parent(nav_pages)
      grouped = {}
      
      nav_pages.each do |page|
        parent_key = page[:parent] || page[:category] || 'root'
        grouped[parent_key] ||= []
        grouped[parent_key] << page
      end
      
      grouped
    end

    def self.find_parent_page(pages, parent_name)
      # Look for an index page or page with matching title
      pages.find do |page|
        page[:title].downcase.include?('index') ||
        page[:title].downcase == parent_name.downcase ||
        page[:url].end_with?('/')
      end
    end
  end
end

# Register the hook to run after site initialization
Jekyll::Hooks.register :site, :post_init do |site|
  Jekyll::DynamicNavigationHook.setup(site)
end 