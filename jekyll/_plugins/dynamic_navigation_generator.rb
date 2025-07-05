# frozen_string_literal: true

require 'yaml'

module Jekyll
  # Dynamic Navigation Generator - Pure frontmatter-driven navigation
  # Scans entire project for co-located markdown files with navigation frontmatter
  class DynamicNavigationGenerator < Generator
    safe true
    priority :high # Run early to set up navigation before other generators

    def generate(site)
      @site = site
      
      Jekyll.logger.warn "Dynamic Navigation:", "Starting navigation generation..."
      Jekyll.logger.warn "Dynamic Navigation:", "Jekyll source: #{site.source}"
      
      # Collect all pages with navigation frontmatter from entire project
      nav_pages = collect_navigation_pages_from_project
      
      Jekyll.logger.warn "Dynamic Navigation:", "Found #{nav_pages.length} pages with navigation frontmatter"
      nav_pages.each { |p| Jekyll.logger.warn "Dynamic Navigation:", "  - #{p[:title]} (#{p[:category] || p[:parent] || 'root'})" }
      
      # Build navigation tree from parent/category relationships
      navigation_tree = build_navigation_from_frontmatter(nav_pages)
      
      # Set the navigation in site data
      site.data['auto_navigation'] = navigation_tree
      
      Jekyll.logger.warn "Dynamic Navigation:", "Generated navigation with #{navigation_tree.length} sections"
      Jekyll.logger.warn "Dynamic Navigation:", "Navigation sections: #{navigation_tree.map { |n| n[:title] }.join(', ')}"
    end

    private

    def collect_navigation_pages_from_project
      nav_pages = []
      
      # Get project root (parent of Jekyll directory)
      project_root = File.expand_path('..', @site.source)
      Jekyll.logger.warn "Dynamic Navigation:", "Scanning project root: #{project_root}"
      
      # Find all markdown files in the entire project
      Dir.glob(File.join(project_root, '**', '*.md')).each do |file_path|
        next unless File.file?(file_path)
        
        # Skip files in node_modules, .git, etc.
        relative_path = file_path.sub(project_root + '/', '')
        next if relative_path.start_with?('node_modules/', '.git/', 'vendor/', '.next/')
        
        Jekyll.logger.warn "Dynamic Navigation:", "Checking file: #{relative_path}"
        
        # Parse frontmatter
        begin
          content = File.read(file_path)
          next unless content.match(/\A---\s*\n.*?\n---\s*\n/m)
          
          front_matter = YAML.safe_load(content.match(/\A---\s*\n(.*?)\n---\s*\n/m)[1]) || {}
        rescue => e
          Jekyll.logger.warn "Dynamic Navigation:", "  Error parsing #{relative_path}: #{e.message}"
          next
        end
        
        # Only include pages with navigation frontmatter
        next unless has_nav_frontmatter?(front_matter)
        
        # Skip if explicitly excluded
        next if front_matter['nav_exclude'] == true
        
        Jekyll.logger.warn "Dynamic Navigation:", "  -> Including in navigation"
        
        # Extract title from content or frontmatter
        title = front_matter['title'] || extract_title_from_content(content)
        
        # Generate URL from permalink or file path
        url = front_matter['permalink'] || generate_url_from_path(relative_path)
        
        nav_pages << {
          title: title,
          url: url,
          description: front_matter['description'],
          parent: front_matter['parent'],
          category: front_matter['category'],
          nav_order: front_matter['nav_order'] || 999,
          file_path: relative_path,
          front_matter: front_matter
        }
      end
      
      nav_pages
    end

    def has_nav_frontmatter?(front_matter)
      return false unless front_matter
      
      # Must have either parent, category, or be a root page with title and permalink
      has_nav = front_matter['parent'] || front_matter['category'] || 
                (front_matter['title'] && front_matter['permalink'])
      
      Jekyll.logger.warn "Dynamic Navigation:", "    has_nav_frontmatter? #{has_nav} (parent: #{front_matter['parent']}, category: #{front_matter['category']}, title: #{front_matter['title']}, permalink: #{front_matter['permalink']})"
      
      has_nav
    end

    def extract_title_from_content(content)
      # Look for H1 heading in content
      body = content.sub(/\A---\s*\n.*?\n---\s*\n/m, '')
      match = body.match(/^#\s+(.+)$/m)
      match ? match[1].strip : nil
    end

    def generate_url_from_path(relative_path)
      # Convert file path to URL
      url = '/' + relative_path.sub(/\.md$/, '/')
      
      # Clean up URL - remove index and handle special cases
      url = url.sub(/\/index\/$/, '/')
      url = url.gsub(/\/+/, '/')
      
      # Handle special directories
      url = url.sub(/^\/src\//, '/development/')
      url = url.sub(/^\/cmd\//, '/tools/')
      url = url.sub(/^\/community\//, '/community/')
      url = url.sub(/^\/jekyll\//, '/')
      
      url
    end

    def build_navigation_from_frontmatter(nav_pages)
      # Group pages by category or parent
      categories = {}
      root_pages = []
      
      nav_pages.each do |page|
        if page[:category]
          # Page belongs to a category
          category_key = page[:category]
          categories[category_key] ||= []
          categories[category_key] << page
        elsif page[:parent]
          # Page has a parent - parent becomes the category
          parent_key = page[:parent]
          categories[parent_key] ||= []
          categories[parent_key] << page
        else
          # Root-level page
          root_pages << page
        end
      end
      
      # Build navigation sections
      navigation_sections = []
      
      # Add root pages first
      root_pages.sort_by { |p| p[:nav_order] }.each do |page|
        navigation_sections << {
          title: page[:title],
          url: page[:url],
          description: page[:description] || "#{page[:title]} documentation"
        }
      end
      
      # Add categories
      categories.each do |category_name, pages|
        # Sort pages within category
        sorted_pages = pages.sort_by { |p| p[:nav_order] }
        
        # Find or create category index page
        index_page = sorted_pages.find { |p| p[:url].end_with?('/') || p[:title].downcase.include?('index') }
        category_url = index_page ? index_page[:url] : "/#{category_name.downcase.gsub(/\s+/, '-')}/"
        
        # Build subnav for category
        subnav = sorted_pages.map do |page|
          {
            title: page[:title],
            url: page[:url],
            description: page[:description] || "#{page[:title]} documentation"
          }
        end
        
        navigation_sections << {
          title: category_name,
          url: category_url,
          description: "#{category_name} documentation and resources",
          subnav: subnav
        }
      end
      
      navigation_sections
    end
  end
end 