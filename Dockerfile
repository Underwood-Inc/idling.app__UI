# Use the official Node.js image as the base image
FROM node:20

# Install zsh, git, Go and Playwright browser dependencies for development environment
RUN apt-get update && apt-get install -y \
  zsh \
  git \
  curl \
  wget \
  fonts-powerline \
  # Build dependencies for native packages
  build-essential \
  zlib1g-dev \
  # Playwright browser dependencies
  libnspr4 \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libasound2 \
  libatspi2.0-0 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0 \
  libxshmfence1 \
  && rm -rf /var/lib/apt/lists/*

# Jekyll dependencies removed - now using Docusaurus

# Install Go 1.21.x
ENV GO_VERSION=1.21.5
RUN wget --timeout=30 --tries=3 https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
  tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
  rm go${GO_VERSION}.linux-amd64.tar.gz

# Set Go environment variables
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV GOBIN="/go/bin"
ENV PATH="${GOBIN}:${PATH}"

# Create Go workspace
RUN mkdir -p /go/{bin,src,pkg} && chmod -R 755 /go

# Install Powerlevel10k
RUN git clone --depth=1 https://github.com/romkatv/powerlevel10k.git /opt/powerlevel10k

# Configure zsh with Powerlevel10k globally
RUN echo 'source /opt/powerlevel10k/powerlevel10k.zsh-theme' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_DISABLE_CONFIGURATION_WIZARD=true' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_LEFT_PROMPT_ELEMENTS=(context dir vcs)' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_RIGHT_PROMPT_ELEMENTS=(status root_indicator background_jobs history time)' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_PROMPT_ON_NEWLINE=true' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_MULTILINE_FIRST_PROMPT_PREFIX=""' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_MULTILINE_LAST_PROMPT_PREFIX="❯ "' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_MODE="nerdfont-complete"' >> /etc/zsh/zshrc && \
  echo 'POWERLEVEL10K_INSTANT_PROMPT=quiet' >> /etc/zsh/zshrc && \
  echo 'export PATH="/usr/local/go/bin:$PATH"' >> /etc/zsh/zshrc && \
  echo 'export GOPATH="/go"' >> /etc/zsh/zshrc && \
  echo 'export GOBIN="/go/bin"' >> /etc/zsh/zshrc && \
  echo 'export PATH="$GOBIN:$PATH"' >> /etc/zsh/zshrc

# Set zsh as the default shell for root
RUN chsh -s /usr/bin/zsh root

# Create .zshrc for root user
RUN echo 'source /etc/zsh/zshrc' > /root/.zshrc

# Set SHELL environment variable to zsh
ENV SHELL=/usr/bin/zsh

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml first for better caching
COPY package*.json pnpm-lock.yaml ./

# Copy custom eslint rules (needed for local package reference)
COPY custom-eslint-rules/ ./custom-eslint-rules/

# Install Node.js dependencies
RUN corepack enable && pnpm install

# Install Playwright browsers after dependencies are installed
RUN npx playwright install --with-deps

# Copy the rest of the application code
COPY . .

# Copy and set up the entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 3000 (Next.js)
EXPOSE 3000

# Use the entrypoint script to run migrations and start the app
CMD ["/usr/local/bin/docker-entrypoint.sh"]
