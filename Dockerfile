# Use the official Node.js image as the base image
FROM node:20

# Install Ruby, Jekyll dependencies, zsh, and git
RUN apt-get update && apt-get install -y \
  ruby-full \
  build-essential \
  zlib1g-dev \
  zsh \
  git \
  curl \
  fonts-powerline \
  && rm -rf /var/lib/apt/lists/*

# Set Ruby environment variables
ENV GEM_HOME="/usr/local/bundle"
ENV PATH="$GEM_HOME/bin:/usr/local/bin:$PATH"
ENV BUNDLE_SILENCE_ROOT_WARNING=1
ENV BUNDLE_APP_CONFIG="$GEM_HOME"

# Install Bundler and Jekyll (GitHub Pages compatible versions)
RUN gem install bundler:2.5.23 && \
  gem install jekyll:3.10.0 && \
  gem cleanup

# Install Powerlevel10k
RUN git clone --depth=1 https://github.com/romkatv/powerlevel10k.git /opt/powerlevel10k

# Configure zsh with Powerlevel10k globally
RUN echo 'source /opt/powerlevel10k/powerlevel10k.zsh-theme' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(context dir vcs)' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(status root_indicator background_jobs history time)' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_PROMPT_ON_NEWLINE=true' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_MULTILINE_FIRST_PROMPT_PREFIX=""' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_MULTILINE_LAST_PROMPT_PREFIX="❯ "' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_MODE="nerdfont-complete"' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL9K_INSTANT_PROMPT=quiet' >> /etc/zsh/zshrc

# Set zsh as the default shell for root
RUN chsh -s /usr/bin/zsh root

# Create .zshrc for root user
RUN echo 'source /etc/zsh/zshrc' > /root/.zshrc

# Set SHELL environment variable to zsh
ENV SHELL=/usr/bin/zsh

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock first for better caching
COPY package*.json yarn.lock ./

# Copy custom eslint rules (needed for local package reference)
COPY custom-eslint-rules/ ./custom-eslint-rules/

# Install Node.js dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Install Jekyll dependencies if DOCS/Gemfile exists
RUN if [ -f "DOCS/Gemfile" ]; then \
  cd DOCS && \
  bundle config set --local path 'vendor/bundle' && \
  bundle install --retry 3 && \
  bundle clean; \
  fi

# Expose ports 3000 (Next.js) and 4000 (Jekyll docs)
EXPOSE 3000 4000

# Start the Next.js application with zsh
CMD ["npm", "run", "dev"]
