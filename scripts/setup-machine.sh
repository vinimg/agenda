#!/usr/bin/env bash
# Setup script — new machine bootstrap
# Run as: bash setup-machine.sh

set -e

echo "==> Starting machine setup..."

# ── Shell ──────────────────────────────────────────────────────────────────────
if ! command -v zsh &>/dev/null; then
  echo "→ Installing zsh..."
  sudo apt-get update -qq && sudo apt-get install -y zsh
fi

if [ ! -d "$HOME/.oh-my-zsh" ]; then
  echo "→ Installing oh-my-zsh..."
  RUNZSH=no CHSH=no sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
fi

# zsh-autosuggestions
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
[ ! -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ] && \
  git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"

# zsh-syntax-highlighting
[ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ] && \
  git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"

# powerlevel10k
[ ! -d "$ZSH_CUSTOM/themes/powerlevel10k" ] && \
  git clone --depth=1 https://github.com/romkatv/powerlevel10k "$ZSH_CUSTOM/themes/powerlevel10k"

# ── Core tools ─────────────────────────────────────────────────────────────────
echo "→ Installing core tools..."
sudo apt-get install -y -qq \
  git curl wget unzip build-essential \
  ripgrep fzf bat eza jq \
  ca-certificates gnupg

# ── Node.js via nvm ────────────────────────────────────────────────────────────
if ! command -v nvm &>/dev/null && [ ! -d "$HOME/.nvm" ]; then
  echo "→ Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
fi

# ── GitHub CLI ─────────────────────────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "→ Installing gh..."
  type -p curl >/dev/null || sudo apt install curl -y
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update -qq && sudo apt install gh -y
fi

# ── Claude Code ────────────────────────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
  echo "→ Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code
fi

# ── Git config ─────────────────────────────────────────────────────────────────
echo "→ Configuring git..."
git config --global core.editor "code --wait"
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.st "status -sb"

# ── .zshrc ─────────────────────────────────────────────────────────────────────
echo "→ Writing .zshrc..."
cat > "$HOME/.zshrc" << 'ZSHRC'
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git zsh-autosuggestions zsh-syntax-highlighting fzf)
source $ZSH/oh-my-zsh.sh

# nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# Aliases
alias ls="eza --icons"
alias ll="eza -la --icons --git"
alias cat="batcat"
alias grep="rg"
alias g="git"
alias claude="claude --dangerously-skip-permissions"

# Windows interop
alias desktop="cd /mnt/c/Users/vini/Desktop"
alias open="explorer.exe"

# fzf
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
export FZF_DEFAULT_COMMAND='rg --files --hidden --follow --glob "!.git"'
ZSHRC

# ── Set zsh as default shell ────────────────────────────────────────────────────
CURRENT_SHELL=$(getent passwd "$USER" | cut -d: -f7)
if [ "$CURRENT_SHELL" != "$(which zsh)" ]; then
  echo "→ Setting zsh as default shell..."
  chsh -s "$(which zsh)"
fi

# ── Copy Claude Code settings ───────────────────────────────────────────────────
echo "→ Symlinking Claude config..."
mkdir -p "$HOME/.claude"
# settings.json is committed at ~/.claude/settings.json — copy if exists
# CLAUDE.md global instructions should be placed at ~/.claude/CLAUDE.md

echo ""
echo "✓ Setup complete! Restart terminal or run: exec zsh"
echo ""
echo "Next steps:"
echo "  1. gh auth login"
echo "  2. git config --global user.name 'Your Name'"
echo "  3. git config --global user.email 'you@email.com'"
echo "  4. claude  (login on first run)"
