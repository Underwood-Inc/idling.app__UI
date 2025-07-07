Jekyll::Hooks.register :site, :after_init do |site|
  Jekyll.logger.warn "TEST PLUGIN:", "🚀 HOOKS ARE WORKING! Jekyll version: #{Jekyll::VERSION}"
  puts "🚀 TEST PLUGIN HOOK EXECUTED!"
end 