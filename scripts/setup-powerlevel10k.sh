#!/bin/bash

# 🧙‍♂️ Powerlevel10k Setup Script - Production Ready
# This script installs and configures Powerlevel10k with all the bells and whistles

set -e  # Exit on any error

echo "🚀 Starting Powerlevel10k Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
sudo apt update
sudo apt install -y \
    zsh \
    git \
    curl \
    wget \
    unzip \
    fontconfig \
    build-essential \
    python3-pip \
    nodejs \
    npm \
    htop \
    neofetch \
    tree \
    bat \
    exa \
    fd-find \
    ripgrep \
    fzf \
    tmux \
    vim \
    nano

# Install Oh My Zsh
print_status "Installing Oh My Zsh..."
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
else
    print_warning "Oh My Zsh already installed"
fi

# Install Powerlevel10k
print_status "Installing Powerlevel10k theme..."
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" ]; then
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
else
    print_warning "Powerlevel10k already installed"
fi

# Install useful Oh My Zsh plugins
print_status "Installing Oh My Zsh plugins..."

# zsh-autosuggestions
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions" ]; then
    git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
fi

# zsh-syntax-highlighting
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting" ]; then
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
fi

# zsh-completions
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-completions" ]; then
    git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-completions
fi

# Install Nerd Fonts
print_status "Installing Nerd Fonts..."
FONT_DIR="$HOME/.local/share/fonts"
mkdir -p "$FONT_DIR"

# Download and install MesloLGS NF (recommended for Powerlevel10k)
cd /tmp
wget -O "MesloLGS_NF_Regular.ttf" "https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Regular.ttf"
wget -O "MesloLGS_NF_Bold.ttf" "https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Bold.ttf"
wget -O "MesloLGS_NF_Italic.ttf" "https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Italic.ttf"
wget -O "MesloLGS_NF_Bold_Italic.ttf" "https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Bold%20Italic.ttf"

mv MesloLGS_NF_*.ttf "$FONT_DIR/"
fc-cache -fv

# Create optimized .zshrc
print_status "Creating optimized .zshrc configuration..."
cat > "$HOME/.zshrc" << 'EOF'
# 🧙‍♂️ Powerlevel10k Instant Prompt
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Oh My Zsh Configuration
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"

# Plugin Configuration
plugins=(
    git
    docker
    docker-compose
    node
    npm
    yarn
    python
    pip
    sudo
    history
    colored-man-pages
    command-not-found
    zsh-autosuggestions
    zsh-syntax-highlighting
    zsh-completions
)

# Load Oh My Zsh
source $ZSH/oh-my-zsh.sh

# Powerlevel10k Configuration
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# Environment Variables
export EDITOR='vim'
export VISUAL='vim'
export PAGER='less'
export LANG='en_US.UTF-8'
export LC_ALL='en_US.UTF-8'

# History Configuration
HISTSIZE=10000
SAVEHIST=10000
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_IGNORE_SPACE
setopt HIST_SAVE_NO_DUPS
setopt HIST_REDUCE_BLANKS
setopt SHARE_HISTORY

# Aliases
alias ll='exa -la --icons --git'
alias ls='exa --icons'
alias la='exa -la --icons'
alias lt='exa --tree --icons'
alias cat='batcat'
alias grep='rg'
alias find='fd'
alias top='htop'
alias df='df -h'
alias du='du -h'
alias free='free -h'
alias ps='ps aux'
alias mkdir='mkdir -pv'
alias cp='cp -iv'
alias mv='mv -iv'
alias rm='rm -iv'
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ~='cd ~'
alias -- -='cd -'

# Git Aliases
alias g='git'
alias ga='git add'
alias gc='git commit'
alias gco='git checkout'
alias gd='git diff'
alias gl='git log --oneline --graph --decorate'
alias gp='git push'
alias gpl='git pull'
alias gs='git status'
alias gb='git branch'

# Docker Aliases
alias d='docker'
alias dc='docker-compose'
alias dps='docker ps'
alias di='docker images'
alias dex='docker exec -it'
alias dlog='docker logs -f'

# Node/NPM/Yarn Aliases
alias ni='npm install'
alias nr='npm run'
alias ns='npm start'
alias nt='npm test'
alias yi='yarn install'
alias yr='yarn run'
alias ys='yarn start'
alias yt='yarn test'

# System Information
alias sysinfo='neofetch'
alias weather='curl wttr.in'
alias myip='curl ipinfo.io/ip'
alias ports='netstat -tuln'
alias listening='lsof -i -P -n | grep LISTEN'

# Functions
mkcd() {
    mkdir -p "$1" && cd "$1"
}

extract() {
    if [ -f $1 ] ; then
        case $1 in
            *.tar.bz2)   tar xjf $1     ;;
            *.tar.gz)    tar xzf $1     ;;
            *.bz2)       bunzip2 $1     ;;
            *.rar)       unrar e $1     ;;
            *.gz)        gunzip $1      ;;
            *.tar)       tar xf $1      ;;
            *.tbz2)      tar xjf $1     ;;
            *.tgz)       tar xzf $1     ;;
            *.zip)       unzip $1       ;;
            *.Z)         uncompress $1  ;;
            *.7z)        7z x $1        ;;
            *)     echo "'$1' cannot be extracted via extract()" ;;
        esac
    else
        echo "'$1' is not a valid file"
    fi
}

# FZF Configuration
if command -v fzf >/dev/null 2>&1; then
    export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
    export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
    export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
fi

# Load additional completions
autoload -U compinit && compinit

# Welcome message
echo "🧙‍♂️ Welcome to your enhanced terminal experience!"
echo "💡 Pro tips:"
echo "   - Use 'sysinfo' to see system information"
echo "   - Use 'll' for enhanced directory listing"
echo "   - Use 'weather' to check the weather"
echo "   - Press Ctrl+R for fuzzy history search"
echo ""
EOF

# Create Powerlevel10k configuration
print_status "Creating Powerlevel10k configuration..."
cat > "$HOME/.p10k.zsh" << 'EOF'
# Generated by Powerlevel10k configuration wizard.
# Based on romkatv/powerlevel10k/config/p10k-lean.zsh.
# Wizard options: nerdfont-complete + powerline, small icons, lean, unicode,
# darkblood, 24h time, angled separators, sharp heads, flat tails, 2 lines, disconnected,
# no frame, compact, few icons, concise, transient_prompt, instant_prompt=verbose.
'use strict'
() {
  emulate -L zsh -o extended_glob
  unset 'POWERLEVEL9K_*' 'DEFAULT_USER'
  [[ $ZSH_VERSION == (5.<1->*|<6->.*) ]] || return

  typeset -g POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(
    os_icon
    dir
    vcs
    prompt_char
  )

  typeset -g POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(
    status
    command_execution_time
    background_jobs
    direnv
    asdf
    virtualenv
    anaconda
    pyenv
    goenv
    nodenv
    nvm
    nodeenv
    node_version
    go_version
    rust_version
    dotnet_version
    php_version
    laravel_version
    java_version
    package
    rbenv
    rvm
    fvm
    luaenv
    jenv
    plenv
    phpenv
    scalaenv
    haskell_stack
    kubecontext
    terraform
    aws
    aws_eb_env
    azure
    gcloud
    google_app_cred
    context
    nordvpn
    ranger
    nnn
    xplr
    vim_shell
    midnight_commander
    nix_shell
    todo
    timewarrior
    taskwarrior
    time
    newline
    cpu
    disk_usage
    ram
    swap
    load
    wifi
    ip
    proxy
    firewall
    vpn_ip
    public_ip
    battery
    example
  )

  typeset -g POWERLEVEL9K_MODE=nerdfont-complete
  typeset -g POWERLEVEL9K_ICON_PADDING=none
  typeset -g POWERLEVEL9K_ICON_BEFORE_CONTENT=true
  typeset -g POWERLEVEL9K_PROMPT_ADD_NEWLINE=true
  typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_PREFIX=
  typeset -g POWERLEVEL9K_MULTILINE_NEWLINE_PROMPT_PREFIX=
  typeset -g POWERLEVEL9K_MULTILINE_LAST_PROMPT_PREFIX=
  typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_SUFFIX=
  typeset -g POWERLEVEL9K_MULTILINE_NEWLINE_PROMPT_SUFFIX=
  typeset -g POWERLEVEL9K_MULTILINE_LAST_PROMPT_SUFFIX=
  typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR=' '
  typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_BACKGROUND=
  typeset -g POWERLEVEL9K_MULTILINE_NEWLINE_PROMPT_GAP_BACKGROUND=
  if [[ $POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR != ' ' ]]; then
    typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_FOREGROUND=242
    typeset -g POWERLEVEL9K_EMPTY_LINE_LEFT_PROMPT_FIRST_SEGMENT_END_SYMBOL='%{%}'
    typeset -g POWERLEVEL9K_EMPTY_LINE_RIGHT_PROMPT_FIRST_SEGMENT_START_SYMBOL='%{%}'
  fi
  typeset -g POWERLEVEL9K_LEFT_SUBSEGMENT_SEPARATOR=' '
  typeset -g POWERLEVEL9K_RIGHT_SUBSEGMENT_SEPARATOR=' '
  typeset -g POWERLEVEL9K_LEFT_SEGMENT_SEPARATOR=''
  typeset -g POWERLEVEL9K_RIGHT_SEGMENT_SEPARATOR=''
  typeset -g POWERLEVEL9K_LEFT_PROMPT_FIRST_SEGMENT_START_SYMBOL=''
  typeset -g POWERLEVEL9K_RIGHT_PROMPT_LAST_SEGMENT_END_SYMBOL=''
  typeset -g POWERLEVEL9K_EMPTY_LINE_LEFT_PROMPT_LAST_SEGMENT_END_SYMBOL=

  # OS identifier color.
  typeset -g POWERLEVEL9K_OS_ICON_FOREGROUND=232
  typeset -g POWERLEVEL9K_OS_ICON_BACKGROUND=7

  # Directory colors.
  typeset -g POWERLEVEL9K_DIR_FOREGROUND=31
  typeset -g POWERLEVEL9K_DIR_BACKGROUND=
  typeset -g POWERLEVEL9K_DIR_SHORTENED_FOREGROUND=103
  typeset -g POWERLEVEL9K_DIR_ANCHOR_FOREGROUND=39
  typeset -g POWERLEVEL9K_DIR_ANCHOR_BOLD=true
  local anchor_files=(
    .bzr
    .citc
    .git
    .hg
    .node-gyp
    .svn
    .terraform
    CVS
    Cargo.toml
    composer.json
    go.mod
    package.json
  )
  typeset -g POWERLEVEL9K_SHORTEN_STRATEGY=truncate_to_unique
  typeset -g POWERLEVEL9K_SHORTEN_DELIMITER=
  typeset -g POWERLEVEL9K_DIR_SHORTENED_FOREGROUND=103
  typeset -g POWERLEVEL9K_DIR_ANCHOR_BOLD=true
  typeset -g POWERLEVEL9K_SHORTEN_FOLDER_MARKER="(${(j:|:)anchor_files})"
  typeset -g POWERLEVEL9K_SHORTEN_DIR_LENGTH=1
  typeset -g POWERLEVEL9K_DIR_MAX_LENGTH=80
  typeset -g POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS=40
  typeset -g POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS_PCT=50
  typeset -g POWERLEVEL9K_DIR_HYPERLINK=false
  typeset -g POWERLEVEL9K_DIR_SHOW_WRITABLE=v3

  # VCS colors.
  typeset -g POWERLEVEL9K_VCS_BRANCH_ICON=
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_ICON='?'
  function my_git_formatter() {
    emulate -L zsh
    if [[ -n $P9K_CONTENT ]]; then
      typeset -g my_git_format=$P9K_CONTENT
      return
    fi
    if (( $1 )); then
      P9K_CONTENT+='%76F'
    else
      P9K_CONTENT+='%178F'
    fi
    P9K_CONTENT+='${$((my_git_format+=${P9K_CONTENT}))%_}'
  }
  functions -M my_git_formatter 2>/dev/null
  typeset -g POWERLEVEL9K_VCS_MAX_INDEX_SIZE_DIRTY=-1
  typeset -g POWERLEVEL9K_VCS_DISABLED_WORKDIR_PATTERN='~'
  typeset -g POWERLEVEL9K_VCS_DISABLE_GITSTATUS_FORMATTING=true
  typeset -g POWERLEVEL9K_VCS_CONTENT_EXPANSION='${$((my_git_format=))%_}${my_git_formatter(1)}'
  typeset -g POWERLEVEL9K_VCS_{STAGED,UNSTAGED,UNTRACKED,CONFLICTED,COMMITS_AHEAD,COMMITS_BEHIND}_MAX_NUM=-1
  typeset -g POWERLEVEL9K_VCS_VISUAL_IDENTIFIER_COLOR=76
  typeset -g POWERLEVEL9K_VCS_LOADING_VISUAL_IDENTIFIER_COLOR=244
  typeset -g POWERLEVEL9K_VCS_BACKENDS=(git)
  typeset -g POWERLEVEL9K_VCS_CLEAN_FOREGROUND=76
  typeset -g POWERLEVEL9K_VCS_CLEAN_BACKGROUND=
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_FOREGROUND=76
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_BACKGROUND=
  typeset -g POWERLEVEL9K_VCS_MODIFIED_FOREGROUND=178
  typeset -g POWERLEVEL9K_VCS_MODIFIED_BACKGROUND=

  # Status on success. No content, just an icon. No need to show it if prompt_char is enabled as
  # it will signify success by turning green.
  typeset -g POWERLEVEL9K_STATUS_OK=true
  typeset -g POWERLEVEL9K_STATUS_OK_FOREGROUND=70
  typeset -g POWERLEVEL9K_STATUS_OK_BACKGROUND=
  typeset -g POWERLEVEL9K_STATUS_OK_VISUAL_IDENTIFIER_EXPANSION='✓'
  # Status when some part of a pipe command fails but the overall exit status is zero. It may look
  # like this: 1|0.
  typeset -g POWERLEVEL9K_STATUS_OK_PIPE=true
  typeset -g POWERLEVEL9K_STATUS_OK_PIPE_FOREGROUND=70
  typeset -g POWERLEVEL9K_STATUS_OK_PIPE_BACKGROUND=
  typeset -g POWERLEVEL9K_STATUS_OK_PIPE_VISUAL_IDENTIFIER_EXPANSION='✓'
  # Status when it's just an error code (e.g., '1'). No need to show it if prompt_char is enabled as
  # it will signify error by turning red.
  typeset -g POWERLEVEL9K_STATUS_ERROR=true
  typeset -g POWERLEVEL9K_STATUS_ERROR_FOREGROUND=160
  typeset -g POWERLEVEL9K_STATUS_ERROR_BACKGROUND=
  typeset -g POWERLEVEL9K_STATUS_ERROR_VISUAL_IDENTIFIER_EXPANSION='✗'
  # Status when the command was terminated by a signal.
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL=true
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL_FOREGROUND=160
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL_BACKGROUND=
  # Use terse signal names: "INT" instead of "SIGINT(2)".
  typeset -g POWERLEVEL9K_STATUS_VERBOSE_SIGNAME=false
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL_VISUAL_IDENTIFIER_EXPANSION='✗'
  # Status when some part of a pipe command fails and the overall exit status is also non-zero.
  # It may look like this: 1|0.
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE=true
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE_FOREGROUND=160
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE_BACKGROUND=
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE_VISUAL_IDENTIFIER_EXPANSION='✗'

  # Command execution time threshold and color.
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD=3
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_PRECISION=0
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FOREGROUND=101
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_BACKGROUND=
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_VISUAL_IDENTIFIER_EXPANSION=
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FORMAT='d h m s'

  # Background jobs color.
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_FOREGROUND=37
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_BACKGROUND=
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_VISUAL_IDENTIFIER_EXPANSION='⇶'

  # System stats
  typeset -g POWERLEVEL9K_LOAD_WHICH=5
  typeset -g POWERLEVEL9K_LOAD_NORMAL_FOREGROUND=66
  typeset -g POWERLEVEL9K_LOAD_WARNING_FOREGROUND=178
  typeset -g POWERLEVEL9K_LOAD_CRITICAL_FOREGROUND=166
  typeset -g POWERLEVEL9K_LOAD_NORMAL_BACKGROUND=
  typeset -g POWERLEVEL9K_LOAD_WARNING_BACKGROUND=
  typeset -g POWERLEVEL9K_LOAD_CRITICAL_BACKGROUND=

  typeset -g POWERLEVEL9K_RAM_FOREGROUND=66
  typeset -g POWERLEVEL9K_RAM_BACKGROUND=
  typeset -g POWERLEVEL9K_RAM_VISUAL_IDENTIFIER_EXPANSION='🐏'

  typeset -g POWERLEVEL9K_DISK_USAGE_NORMAL_FOREGROUND=35
  typeset -g POWERLEVEL9K_DISK_USAGE_WARNING_FOREGROUND=220
  typeset -g POWERLEVEL9K_DISK_USAGE_CRITICAL_FOREGROUND=160
  typeset -g POWERLEVEL9K_DISK_USAGE_WARNING_LEVEL=90
  typeset -g POWERLEVEL9K_DISK_USAGE_CRITICAL_LEVEL=95
  typeset -g POWERLEVEL9K_DISK_USAGE_ONLY_WARNING=false
  typeset -g POWERLEVEL9K_DISK_USAGE_NORMAL_BACKGROUND=
  typeset -g POWERLEVEL9K_DISK_USAGE_WARNING_BACKGROUND=
  typeset -g POWERLEVEL9K_DISK_USAGE_CRITICAL_BACKGROUND=

  # Time colors.
  typeset -g POWERLEVEL9K_TIME_FOREGROUND=66
  typeset -g POWERLEVEL9K_TIME_BACKGROUND=
  typeset -g POWERLEVEL9K_TIME_VISUAL_IDENTIFIER_EXPANSION=
  typeset -g POWERLEVEL9K_TIME_FORMAT='%D{%H:%M:%S}'
  typeset -g POWERLEVEL9K_TIME_UPDATE_ON_COMMAND=false

  # Prompt character: ❯ in green or ❯ in red, depending on the last command exit status.
  typeset -g POWERLEVEL9K_PROMPT_CHAR_OK_{VIINS,VICMD,VIVIS,VIOWR}_FOREGROUND=76
  typeset -g POWERLEVEL9K_PROMPT_CHAR_ERROR_{VIINS,VICMD,VIVIS,VIOWR}_FOREGROUND=196
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIINS_CONTENT_EXPANSION='❯'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VICMD_CONTENT_EXPANSION='❮'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIVIS_CONTENT_EXPANSION='Ⅴ'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIOWR_CONTENT_EXPANSION='▶'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_BACKGROUND=
  typeset -g POWERLEVEL9K_PROMPT_CHAR_LEFT_PROMPT_LAST_SEGMENT_END_SYMBOL=
  typeset -g POWERLEVEL9K_PROMPT_CHAR_LEFT_PROMPT_FIRST_SEGMENT_START_SYMBOL=
  typeset -g POWERLEVEL9K_PROMPT_CHAR_LEFT_{LEFT,RIGHT}_WHITESPACE=

  # Transient prompt works similarly to the builtin transient_rprompt option. It trims down prompt
  # when accepting a command line. Supported values:
  #
  #   - off:      Don't change prompt when accepting a command line.
  #   - always:   Trim down prompt when accepting a command line.
  #   - same-dir: Trim down prompt when accepting a command line unless this is the first command
  #               typed after changing current working directory.
  typeset -g POWERLEVEL9K_TRANSIENT_PROMPT=always

  # Instant prompt mode.
  #   - off:     Disable instant prompt. Choose this if you've tried instant prompt and found
  #              it incompatible with your zsh configuration files.
  #   - quiet:   Enable instant prompt and don't print warnings when detecting console output
  #              during zsh initialization. Choose this if you've read and understood
  #              https://github.com/romkatv/powerlevel10k/blob/master/README.md#instant-prompt.
  #   - verbose: Enable instant prompt and print a warning when detecting console output during
  #              zsh initialization. Choose this if you've never tried instant prompt, live
  #              dangerously, and do'nt care about warnings.
  typeset -g POWERLEVEL9K_INSTANT_PROMPT=verbose

  # Hot reload allows you to change POWERLEVEL9K options after Powerlevel10k has been initialized.
  # For example, you can type POWERLEVEL9K_BACKGROUND_JOBS_FOREGROUND=red and see the change
  # immediately. Hot reload can slow down prompt by 1-2 milliseconds, so it's better to keep it
  # turned off unless you really need it.
  typeset -g POWERLEVEL9K_DISABLE_HOT_RELOAD=true

  # If p10k is already loaded, reload configuration.
  # This works even with POWERLEVEL9K_DISABLE_HOT_RELOAD=true.
  (( ! $+functions[p10k] )) || p10k reload
}

# Tell `p10k configure` which file it should overwrite.
typeset -g POWERLEVEL9K_CONFIG_FILE=${${(%):-%x}:a}

(( ${#p10k_config_opts} )) && setopt ${p10k_config_opts[@]}
'builtin' 'unset' 'p10k_config_opts'
EOF

# Set zsh as default shell
print_status "Setting zsh as default shell..."
if [ "$SHELL" != "/usr/bin/zsh" ]; then
    chsh -s /usr/bin/zsh
    print_success "Default shell changed to zsh"
else
    print_warning "Zsh is already the default shell"
fi

# Install additional development tools
print_status "Installing additional development tools..."
sudo npm install -g \
    @angular/cli \
    @vue/cli \
    create-react-app \
    typescript \
    eslint \
    prettier \
    nodemon \
    pm2 \
    http-server \
    serve

# Install Python development tools
print_status "Installing Python development tools..."
pip3 install --user \
    virtualenv \
    pipenv \
    black \
    flake8 \
    pylint \
    autopep8 \
    ipython \
    jupyter

# Create useful directories
print_status "Creating useful directories..."
mkdir -p "$HOME/bin"
mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/projects"
mkdir -p "$HOME/scripts"
mkdir -p "$HOME/.config"

# Add local bin to PATH if not already there
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
fi

if ! echo "$PATH" | grep -q "$HOME/bin"; then
    echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.zshrc"
fi

# Create a welcome script
print_status "Creating welcome script..."
cat > "$HOME/bin/welcome" << 'EOF'
#!/bin/bash
echo "🧙‍♂️ Welcome to your enhanced terminal!"
echo ""
echo "🚀 Installed Tools:"
echo "   • Powerlevel10k theme with custom config"
echo "   • Oh My Zsh with useful plugins"
echo "   • Enhanced file listing (exa)"
echo "   • Better search (ripgrep, fd)"
echo "   • Syntax highlighting (bat)"
echo "   • Fuzzy finder (fzf)"
echo "   • System monitor (htop)"
echo "   • Development tools (node, python, etc.)"
echo ""
echo "💡 Useful Commands:"
echo "   • ll          - Enhanced directory listing"
echo "   • sysinfo     - System information"
echo "   • weather     - Current weather"
echo "   • myip        - Your public IP"
echo "   • extract     - Extract any archive"
echo "   • mkcd        - Create and enter directory"
echo ""
echo "🔧 Configuration Files:"
echo "   • ~/.zshrc    - Zsh configuration"
echo "   • ~/.p10k.zsh - Powerlevel10k configuration"
echo ""
echo "Run 'p10k configure' to reconfigure your prompt!"
EOF

chmod +x "$HOME/bin/welcome"

# Final setup
print_status "Final setup and cleanup..."
sudo apt autoremove -y
sudo apt autoclean

print_success "🎉 Powerlevel10k setup completed successfully!"
print_success "🔄 Please restart your terminal or run 'exec zsh' to apply changes"
print_success "🎨 Run 'p10k configure' to customize your prompt further"
print_success "💡 Run 'welcome' anytime to see available tools and commands"

echo ""
echo "🧙‍♂️ Your terminal is now supercharged with:"
echo "   ✅ Powerlevel10k theme"
echo "   ✅ Oh My Zsh with plugins"
echo "   ✅ Enhanced command-line tools"
echo "   ✅ Development environment"
echo "   ✅ Custom aliases and functions"
echo "   ✅ System monitoring widgets"
echo ""
echo "🚀 Enjoy your new terminal experience!" 