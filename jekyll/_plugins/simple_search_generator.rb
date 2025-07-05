# frozen_string_literal: true

require 'ostruct'

module Jekyll
  # Simple Search Generator - Creates search index for client-side search
  class SimpleSearchGenerator < Generator
    safe true
    priority :low

    def generate(site)
      @site = site
      
      # Create search index JSON
      create_search_index
      
      Jekyll.logger.info "Simple Search:", "Generated search index with #{all_searchable_documents.length} documents"
    end

    private

    def create_search_index
      search_data = all_searchable_documents.map do |doc|
        {
          title: doc.data['title'] || doc.basename,
          url: doc.url,
          content: extract_content(doc),
          excerpt: extract_excerpt(doc),
          category: doc.data['category'] || doc.data['categories']&.first,
          tags: doc.data['tags'] || [],
          date: doc.data['date']&.strftime('%Y-%m-%d')
        }.compact
      end

      # Write search index
      search_index_path = File.join(@site.dest, 'search-index.json')
      File.write(search_index_path, JSON.pretty_generate(search_data))
    end

    def all_searchable_documents
      searchable_docs = []
      base_path = File.expand_path('..', @site.source)
      
      # Find all markdown files in the project (co-located docs)
      Dir.glob(File.join(base_path, '**', '*.md')).each do |file_path|
        next unless File.file?(file_path)
        
        # Parse frontmatter
        content = File.read(file_path)
        next unless content.match(/\A---\s*\n.*?\n---\s*\n/m)
        
        begin
          front_matter = YAML.safe_load(content.match(/\A---\s*\n(.*?)\n---\s*\n/m)[1]) || {}
        rescue YAML::SyntaxError
          next
        end
        
        # Skip if explicitly excluded
        next if front_matter['search_exclude'] == true
        next if front_matter['sitemap'] == false
        
        # Create mock document object
        searchable_docs << OpenStruct.new(
          data: front_matter,
          content: content.sub(/\A---\s*\n.*?\n---\s*\n/m, ''),
          url: front_matter['permalink'] || generate_url_from_path(file_path, base_path),
          basename: File.basename(file_path, '.md')
        )
      end
      
      # Add Jekyll pages and posts
      (@site.pages + @site.posts.docs).each do |doc|
        next if doc.data['search_exclude'] == true
        next if doc.data['sitemap'] == false
        next if doc.url.start_with?('/assets/')
        next if doc.url.end_with?('.xml')
        next if doc.url.end_with?('.json')
        
        searchable_docs << doc
      end
      
      searchable_docs
    end

    def generate_url_from_path(file_path, base_path)
      relative_path = file_path.sub(base_path + '/', '')
      url = '/' + relative_path.sub(/\.md$/, '/')
      url.gsub(/\/+/, '/').sub(/\/index\/$/, '/')
    end

    def extract_content(doc)
      # Get rendered content without HTML tags
      content = doc.content || ''
      content = content.gsub(/<[^>]*>/, ' ')  # Remove HTML tags
      content = content.gsub(/\s+/, ' ')      # Normalize whitespace
      content.strip
    end

    def extract_excerpt(doc)
      excerpt = extract_content(doc)
      excerpt.length > 200 ? excerpt[0..200] + '...' : excerpt
    end
  end
end 