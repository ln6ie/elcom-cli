#!/bin/bash
set -euo pipefail

# Reads version from app.json, generates build number
# In CI: uses GITHUB_RUN_NUMBER for auto-incrementing build number
# Local: uses git commit count as fallback

APP_JSON="${1:-app.json}"

if [ ! -f "$APP_JSON" ]; then
  echo "::error:: $APP_JSON not found"
  exit 1
fi

VERSION=$(node -e "console.log(require('./$APP_JSON').expo.version)")

if [ -z "$VERSION" ]; then
  echo "::error:: could not read version from $APP_JSON"
  exit 1
fi

# Use GITHUB_RUN_NUMBER in CI, git commit count locally
if [ -n "${GITHUB_RUN_NUMBER:-}" ]; then
  BUILD_NUMBER="$GITHUB_RUN_NUMBER"
else
  BUILD_NUMBER=$(git rev-list --count HEAD 2>/dev/null || echo "1")
fi

echo "VERSION=$VERSION"
echo "BUILD_NUMBER=$BUILD_NUMBER"
echo "FULL_VERSION=${VERSION}.${BUILD_NUMBER}"
