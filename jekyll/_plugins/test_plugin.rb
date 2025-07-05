Jekyll::Hooks.register :site, :post_init do |site|
  Jekyll.logger.warn "TEST PLUGIN:", "🚀 PLUGINS ARE WORKING! Jekyll version: #{Jekyll::VERSION}"
end 