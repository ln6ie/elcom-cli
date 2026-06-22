#!/bin/bash
set -euo pipefail

# Reads version from app.json, generates build number
# Build number uses git commit count + date for guaranteed uniqueness
# Apple requires CFBundleVersion to strictly increment per build

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

# Use git commit count (never resets) + date prefix for sorting
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "1")
DATE_TAG=$(date +%Y%m%d)

# Format: YYYYMMDD.commitcount (e.g. 20260622.36)
# - Date ensures chronological order across days
# - Commit count ensures uniqueness within a day
# - Always higher than previously uploaded version "1"
BUILD_NUMBER="${DATE_TAG}.${COMMIT_COUNT}"

echo "VERSION=$VERSION"
echo "BUILD_NUMBER=$BUILD_NUMBER"
echo "FULL_VERSION=${VERSION}.${BUILD_NUMBER}"
