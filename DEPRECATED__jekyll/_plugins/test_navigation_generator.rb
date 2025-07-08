# frozen_string_literal: true

require 'minitest/autorun'
require 'tempfile'
require 'tmpdir'
require_relative 'dynamic_navigation_generator'

class TestDynamicNavigationGenerator < Minitest::Test
  def setup
    @temp_dir = Dir.mktmpdir
    @jekyll_dir = File.join(@temp_dir, 'jekyll')
    @src_dir = File.join(@temp_dir, 'src')
    
    Dir.mkdir(@jekyll_dir)
    Dir.mkdir(@src_dir)
    Dir.mkdir(File.join(@src_dir, 'components'))
    Dir.mkdir(File.join(@src_dir, 'app'))
    
    # Mock Jekyll site
    @site = MockSite.new(@jekyll_dir)
    @generator = Jekyll::DynamicNavigationGenerator.new
  end

  def teardown
    FileUtils.rm_rf(@temp_dir)
  end

  def test_extracts_frontmatter_correctly
    file_path = create_test_file('test.md', <<~CONTENT)
      ---
      title: "Test Page"
      parent: "Components"
      description: "A test page"
      ---
      # Test Content
    CONTENT

    frontmatter = @generator.send(:extract_frontmatter, file_path)
    
    assert_equal "Test Page", frontmatter['title']
    assert_equal "Components", frontmatter['parent']
    assert_equal "A test page", frontmatter['description']
  end

  def test_should_include_in_navigation_with_parent
    frontmatter = {
      'title' => 'Test Page',
      'parent' => 'Components'
    }
    
    assert @generator.send(:should_include_in_navigation?, frontmatter)
  end

  def test_should_include_in_navigation_with_category
    frontmatter = {
      'title' => 'Test Page',
      'category' => 'Development'
    }
    
    assert @generator.send(:should_include_in_navigation?, frontmatter)
  end

  def test_should_include_in_navigation_with_permalink
    frontmatter = {
      'title' => 'Test Page',
      'permalink' => '/test/'
    }
    
    assert @generator.send(:should_include_in_navigation?, frontmatter)
  end

  def test_should_exclude_without_title
    frontmatter = {
      'parent' => 'Components'
    }
    
    refute @generator.send(:should_include_in_navigation?, frontmatter)
  end

  def test_should_exclude_without_nav_info
    frontmatter = {
      'title' => 'Test Page'
    }
    
    refute @generator.send(:should_include_in_navigation?, frontmatter)
  end

  def test_should_exclude_when_nav_exclude_true
    frontmatter = {
      'title' => 'Test Page',
      'parent' => 'Components',
      'nav_exclude' => true
    }
    
    refute @generator.send(:should_include_in_navigation?, frontmatter)
  end

  def test_generates_url_from_path
    url = @generator.send(:generate_url_from_path, 'src/components/navbar/index.md')
    assert_equal '/components/navbar/', url
  end

  def test_generates_url_from_path_without_index
    url = @generator.send(:generate_url_from_path, 'src/components/button.md')
    assert_equal '/components/button/', url
  end

  def test_builds_page_data
    frontmatter = {
      'title' => 'Navbar Component',
      'description' => 'Navigation bar component',
      'parent' => 'Components',
      'nav_order' => 1
    }
    
    page_data = @generator.send(:build_page_data, frontmatter, 'src/components/navbar/index.md')
    
    assert_equal 'Navbar Component', page_data[:title]
    assert_equal '/components/navbar/', page_data[:url]
    assert_equal 'Navigation bar component', page_data[:description]
    assert_equal 'Components', page_data[:parent]
    assert_equal 1, page_data[:nav_order]
  end

  def test_groups_pages_by_parent
    nav_pages = [
      { title: 'Navbar', parent: 'Components', nav_order: 1 },
      { title: 'Button', parent: 'Components', nav_order: 2 },
      { title: 'API Overview', category: 'API', nav_order: 1 },
      { title: 'Home', parent: nil, category: nil, nav_order: 1 }
    ]
    
    grouped = @generator.send(:group_pages_by_parent, nav_pages)
    
    assert_equal 3, grouped.keys.length
    assert_equal 2, grouped['Components'].length
    assert_equal 1, grouped['API'].length
    assert_equal 1, grouped['root'].length
  end

  def test_builds_navigation_structure
    nav_pages = [
      { title: 'Navbar Component', url: '/components/navbar/', description: 'Nav bar', parent: 'Components', nav_order: 1 },
      { title: 'Button Component', url: '/components/button/', description: 'Button', parent: 'Components', nav_order: 2 },
      { title: 'API Overview', url: '/api/', description: 'API docs', category: 'API', nav_order: 1 }
    ]
    
    navigation = @generator.send(:build_navigation_structure, nav_pages)
    
    assert_equal 2, navigation.length
    
    # Find Components section
    components_section = navigation.find { |item| item[:title] == 'Components' }
    assert_not_nil components_section
    assert_equal 2, components_section[:subnav].length
    assert_equal 'Navbar Component', components_section[:subnav][0][:title]
    assert_equal 'Button Component', components_section[:subnav][1][:title]
    
    # Find API section
    api_section = navigation.find { |item| item[:title] == 'API' }
    assert_not_nil api_section
    assert_equal 1, api_section[:subnav].length
    assert_equal 'API Overview', api_section[:subnav][0][:title]
  end

  def test_full_integration
    # Create test markdown files
    create_test_file('src/components/navbar/index.md', <<~CONTENT)
      ---
      title: "Navbar Component"
      description: "Navigation bar component"
      parent: "Components"
      permalink: /components/navbar/
      nav_order: 1
      ---
      # Navbar Component
    CONTENT

    create_test_file('src/components/button.md', <<~CONTENT)
      ---
      title: "Button Component"
      description: "Button component"
      parent: "Components"
      nav_order: 2
      ---
      # Button Component
    CONTENT

    create_test_file('src/app/api/index.md', <<~CONTENT)
      ---
      title: "API Documentation"
      description: "API reference"
      category: "API"
      permalink: /api/
      ---
      # API Documentation
    CONTENT

    # Run the generator
    @generator.generate(@site)
    
    # Check the results
    navigation = @site.data['auto_navigation']
    assert_not_nil navigation
    assert_equal 2, navigation.length
    
    # Verify Components section
    components = navigation.find { |item| item[:title] == 'Components' }
    assert_not_nil components
    assert_equal 2, components[:subnav].length
    assert_equal 'Navbar Component', components[:subnav][0][:title]
    assert_equal '/components/navbar/', components[:subnav][0][:url]
  end

  private

  def create_test_file(relative_path, content)
    full_path = File.join(@temp_dir, relative_path)
    FileUtils.mkdir_p(File.dirname(full_path))
    File.write(full_path, content)
    full_path
  end

  class MockSite
    attr_accessor :data
    attr_reader :source

    def initialize(source)
      @source = source
      @data = {}
    end
  end
end

# Run the tests if this file is executed directly
if __FILE__ == $0
  puts "Running Dynamic Navigation Generator Tests..."
  Minitest.run
end 