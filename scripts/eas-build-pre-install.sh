#!/usr/bin/env bash
set -euo pipefail

# EAS runs this hook before installing JavaScript dependencies. The SSH
# module is a local Expo module, so its iOS static libraries must exist before
# CocoaPods runs after Expo prebuild.
if [[ "${EAS_BUILD_PLATFORM:-}" != "ios" ]]; then
  exit 0
fi

if ! command -v cmake >/dev/null 2>&1; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "CMake is required for the iOS SSH dependency build, but Homebrew is unavailable" >&2
    exit 1
  fi

  echo "CMake is not installed; installing it with Homebrew"
  HOMEBREW_NO_AUTO_UPDATE=1 brew install cmake
fi

if ! command -v cmake >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  CMAKE_PREFIX="$(brew --prefix cmake 2>/dev/null || true)"
  if [[ -n "$CMAKE_PREFIX" && -d "$CMAKE_PREFIX/bin" ]]; then
    export PATH="$CMAKE_PREFIX/bin:$PATH"
  fi
fi

command -v cmake
cmake --version | head -n 1

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/modules/ssh-client/.ios-deps"

echo "Building pinned iOS SSH dependencies at $OUTPUT_DIR"
bash "$PROJECT_ROOT/scripts/build-ios-ssh-deps.sh" "$OUTPUT_DIR"

test -f "$OUTPUT_DIR/include/libssh2.h"
test -f "$OUTPUT_DIR/lib/libssh2.a"
test -f "$OUTPUT_DIR/lib/libmbedcrypto.a"
echo "iOS SSH dependency artifact is ready"
