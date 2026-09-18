#!/usr/bin/env bash
# Precalculus v2 & v3 — Automatic GitHub Repository Push Helper

set -e

USERNAME="$1"
REPONAME="${2:-precalculus-v2-v3}"
GITHUB_TOKEN="$3"

if [ -z "$USERNAME" ]; then
  echo "Usage: $0 <GITHUB_USERNAME> [REPOSITORY_NAME] [GITHUB_TOKEN]"
  echo "Example: $0 bauerk132 precalculus-v2-v3"
  exit 1
fi

echo "=========================================================="
echo " Preparing repository for GitHub: $USERNAME/$REPONAME"
echo "=========================================================="

# Ensure branch is main
git branch -M main

# Configure remote URL
if [ -n "$GITHUB_TOKEN" ]; then
  REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${USERNAME}/${REPONAME}.git"
else
  REMOTE_URL="https://github.com/${USERNAME}/${REPONAME}.git"
fi

if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

echo "Remote set to origin -> https://github.com/${USERNAME}/${REPONAME}.git"
echo "Pushing main branch..."
git push -u origin main

echo "=========================================================="
echo " Successfully pushed to https://github.com/${USERNAME}/${REPONAME} !"
echo "=========================================================="
