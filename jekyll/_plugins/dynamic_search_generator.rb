# frozen_string_literal: true

module Jekyll
  # Dynamic Search Generator - Automatically discovers and indexes all documentation
  class DynamicSearchGenerator < Generator
    safe true
    priority :lowest # Run after all other generators

    def generate(site)
      @site = site
      
      # Discover all markdown files in the project
      search_data = discover_all_documentation
      
      # Create search.json page
      create_search_json_page(search_data)
      
      Jekyll.logger.info "Dynamic Search:", "Indexed #{search_data.length} documentation files"
    end

    private

    def discover_all_documentation
      search_data = []
      base_path = File.expand_path('..', @site.source)
      
      # Define search paths and their categories
      search_paths = {
        'src/app/api' => { category: 'API', section: 'API Reference' },
        'src/components' => { category: 'Components', section: 'Development' },
        'src/lib' => { category: 'Libraries', section: 'Development' },
        'src/templates' => { category: 'Templates', section: 'Development' },
        'community' => { category: 'Community', section: 'Community' },
        'docs' => { category: 'Documentation', section: 'Documentation' }
      }
      
      search_paths.each do |path, metadata|
        full_path = File.join(base_path, path)
        next unless Dir.exist?(full_path)
        
        # Find all markdown files
        pattern = File.join(full_path, '**', '*.md')
        Dir.glob(pattern).each do |file_path|
          doc_data = process_documentation_file(file_path, base_path, metadata)
          search_data << doc_data if doc_data
        end
      end
      
      # Add Jekyll pages and posts
      (@site.pages + @site.posts.docs).each do |page|
        next if should_exclude_page?(page)
        
        search_data << {
          title: page.data['title'] || page.name || 'Documentation',
          content: strip_and_truncate(page.content),
          url: page.url,
          date: page.date&.strftime('%Y-%m-%d') || '2024-01-01',
          category: determine_category(page.url),
          tags: page.data['tags'] || [],
          excerpt: page.data['excerpt'] || page.data['description'] || extract_excerpt(page.content),
          type: page.data['layout'] || 'page',
          section: determine_section(page.url)
        }
      end
      
      search_data
    end

    def process_documentation_file(file_path, base_path, metadata)
      return nil unless File.exist?(file_path)
      
      content = File.read(file_path)
      
      # Parse front matter
      front_matter = {}
      body = content
      
      if content.match(/\A---\s*\n.*?\n---\s*\n/m)
        begin
          front_matter = YAML.safe_load(content.match(/\A---\s*\n(.*?)\n---\s*\n/m)[1]) || {}
          body = content.sub(/\A---\s*\n.*?\n---\s*\n/m, '')
        rescue YAML::SyntaxError
          # Invalid YAML, treat as regular content
        end
      end
      
      # Skip auto-generated stubs
      return nil if front_matter['tags']&.include?('documentation-needed')
      return nil if front_matter['status'] == 'draft' && body.include?('automatically generated')
      return nil if body.strip.length < 100 # Skip very short files
      
      # Generate relative path and URL
      relative_path = file_path.sub(base_path + '/', '')
      url = generate_documentation_url(relative_path)
      
      # Extract title
      title = front_matter['title'] || extract_title_from_content(body) || 
              File.basename(file_path, '.md').gsub(/[-_]/, ' ').split.map(&:capitalize).join(' ')
      
      {
        title: title,
        content: strip_and_truncate(body),
        url: url,
        date: front_matter['date'] || File.mtime(file_path).strftime('%Y-%m-%d'),
        category: front_matter['category'] || metadata[:category],
        tags: front_matter['tags'] || extract_tags_from_content(body),
        excerpt: front_matter['excerpt'] || front_matter['description'] || extract_excerpt(body),
        type: front_matter['type'] || determine_type_from_path(relative_path),
        section: front_matter['section'] || determine_section_from_path(relative_path) || metadata[:section],
        file_path: relative_path
      }
    end

    def generate_documentation_url(relative_path)
      # Convert file paths to URLs based on co-location patterns
      case relative_path
      when %r{^src/app/api/}
        relative_path.sub(%r{^src/app/api/}, '/docs/api/').sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      when %r{^src/components/}
        relative_path.sub(%r{^src/components/}, '/dev/components/').sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      when %r{^src/lib/}
        relative_path.sub(%r{^src/lib/}, '/dev/libraries/').sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      when %r{^src/templates/}
        relative_path.sub(%r{^src/templates/}, '/dev/templates/').sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      when %r{^community/}
        relative_path.sub(%r{^community/}, '/community/').sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      when %r{^docs/}
        relative_path.sub(%r{^docs/}, '/docs/').sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      else
        '/' + relative_path.sub(/\/index\.md$/, '/').sub(/\.md$/, '/')
      end
    end

    def should_exclude_page?(page)
      return true if page.data['exclude_from_search']
      return true if page.url.match?(%r{/assets/|/vendor/|/node_modules/})
      return true if page.url.match?(/\.(xml|json|txt|yml|yaml|css|js|scss|sass)$/)
      return true unless page.data['title'] || page.content&.strip&.length&.positive?
      
      false
    end

    def extract_title_from_content(content)
      # Find first H1 heading
      match = content.match(/^#\s+(.+)$/m)
      match ? match[1].strip : nil
    end

    def extract_excerpt(content)
      # Get first meaningful paragraph
      cleaned = content.gsub(/^#.*$/m, '').strip # Remove headings
      paragraphs = cleaned.split(/\n\s*\n/).reject(&:empty?)
      
      return '' if paragraphs.empty?
      
      first_para = paragraphs.first.strip
      first_para.length > 300 ? first_para[0, 300] + '...' : first_para
    end

    def extract_tags_from_content(content)
      tags = []
      
      # Extract common technical terms
      tech_terms = content.downcase.scan(/\b(api|component|service|hook|utility|function|class|interface|type|config|setup|install|deploy|test|auth|database|server|client|frontend|backend|react|next|typescript|javascript|node|npm|yarn|docker|git|github)\b/).flatten.uniq
      tags.concat(tech_terms)
      
      # Extract from headings
      headings = content.scan(/^#+\s+(.+)$/m).flatten
      headings.each do |heading|
        words = heading.downcase.split(/\s+/).reject { |w| w.length < 3 }
        tags.concat(words)
      end
      
      tags.uniq.first(10) # Limit to 10 tags
    end

    def determine_category(url)
      case url
      when %r{/docs/api/} then 'API'
      when %r{/docs/} then 'Documentation'
      when %r{/dev/components/} then 'Components'
      when %r{/dev/libraries/} then 'Libraries'
      when %r{/dev/} then 'Development'
      when %r{/community/} then 'Community'
      else 'General'
      end
    end

    def determine_section(url)
      case url
      when %r{/getting-started/} then 'Getting Started'
      when %r{/architecture/} then 'Architecture'
      when %r{/deployment/} then 'Deployment'
      when %r{/testing/} then 'Testing'
      when %r{/contributing/} then 'Contributing'
      when %r{/api/} then 'API Reference'
      when %r{/components/} then 'Components'
      when %r{/libraries/} then 'Libraries'
      else 'General'
      end
    end

    def determine_type_from_path(path)
      case path
      when %r{/api/} then 'api'
      when %r{/components/} then 'component'
      when %r{/lib/} then 'library'
      when %r{/templates/} then 'template'
      else 'page'
      end
    end

    def determine_section_from_path(path)
      case path
      when %r{getting-started} then 'Getting Started'
      when %r{architecture} then 'Architecture'
      when %r{deployment} then 'Deployment'
      when %r{testing} then 'Testing'
      when %r{contributing} then 'Contributing'
      when %r{api} then 'API Reference'
      when %r{components} then 'Components'
      when %r{lib} then 'Libraries'
      else nil
      end
    end

    def strip_and_truncate(content)
      return '' unless content
      
      # Remove HTML tags and excessive whitespace
      cleaned = content.gsub(/<[^>]*>/, ' ')
                      .gsub(/\s+/, ' ')
                      .strip
      
      # Truncate to reasonable length for search
      cleaned.length > 2000 ? cleaned[0, 2000] + '...' : cleaned
    end

    def create_search_json_page(search_data)
      # Create a virtual page for search.json
      search_page = PageWithoutAFile.new(@site, @site.source, '', 'search.json')
      search_page.data = {
        'layout' => nil,
        'sitemap' => false,
        'search_data' => search_data
      }
      search_page.content = search_data.to_json
      
      @site.pages << search_page
    end
  end

  # Helper class for creating pages without physical files
  class PageWithoutAFile < Page
    def initialize(site, base, dir, name)
      @site = site
      @base = base
      @dir = dir
      @name = name

      self.process(name)
      self.read_yaml(File.join(base, '_layouts'), 'null.html')
    end

    def read_yaml(*)
      # Override to prevent reading from file
      self.data ||= {}
    end
  end
end 