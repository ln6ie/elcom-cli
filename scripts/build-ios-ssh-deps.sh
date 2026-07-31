#!/usr/bin/env bash
set -euo pipefail

# Reproducible device build for the static SSH dependency used by the Expo
# module. The output is intentionally scoped to the current CI job.

OUTPUT_DIR="${1:?usage: build-ios-ssh-deps.sh <output-directory> }"
WORK_DIR="$(mktemp -d "${RUNNER_TEMP:-/tmp}/elcomcli-ssh.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT

LIBSSH2_VERSION="1.11.1"
LIBSSH2_URL="https://github.com/libssh2/libssh2/releases/download/libssh2-1.11.1/libssh2-1.11.1.tar.gz"
LIBSSH2_SHA256="d9ec76cbe34db98eec3539fe2c899d26b0c837cb3eb466a56b0f109cabf658f7"
MBEDTLS_VERSION="3.6.4"
MBEDTLS_URL="https://github.com/Mbed-TLS/mbedtls/releases/download/mbedtls-3.6.4/mbedtls-3.6.4.tar.bz2"
MBEDTLS_SHA256="ec35b18a6c593cf98c3e30db8b98ff93e8940a8c4e690e66b41dfc011d678110"

download_verified() {
  local url="$1"
  local expected="$2"
  local destination="$3"

  curl --fail --location --silent --show-error --retry 3 "$url" -o "$destination"
  local actual
  actual="$(shasum -a 256 "$destination" | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    echo "SHA256 mismatch for $url" >&2
    echo "expected: $expected" >&2
    echo "actual:   $actual" >&2
    exit 1
  fi
}

mkdir -p "$OUTPUT_DIR"
rm -rf "$OUTPUT_DIR/include" "$OUTPUT_DIR/lib" "$OUTPUT_DIR/share"
mkdir -p "$OUTPUT_DIR/include" "$OUTPUT_DIR/lib"

download_verified "$MBEDTLS_URL" "$MBEDTLS_SHA256" "$WORK_DIR/mbedtls.tar.bz2"
download_verified "$LIBSSH2_URL" "$LIBSSH2_SHA256" "$WORK_DIR/libssh2.tar.gz"

tar -xjf "$WORK_DIR/mbedtls.tar.bz2" -C "$WORK_DIR"
tar -xzf "$WORK_DIR/libssh2.tar.gz" -C "$WORK_DIR"

MBEDTLS_SOURCE="$(find "$WORK_DIR" -maxdepth 1 -type d -name "mbedtls-*" -print -quit)"
LIBSSH2_SOURCE="$(find "$WORK_DIR" -maxdepth 1 -type d -name "libssh2-*" -print -quit)"

cmake -S "$MBEDTLS_SOURCE" -B "$WORK_DIR/mbedtls-build" \
  -DCMAKE_SYSTEM_NAME=iOS \
  -DCMAKE_OSX_SYSROOT=iphoneos \
  -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_INSTALL_PREFIX="$OUTPUT_DIR" \
  -DCMAKE_INSTALL_LIBDIR=lib \
  -DBUILD_SHARED_LIBS=OFF \
  -DENABLE_PROGRAMS=OFF \
  -DENABLE_TESTING=OFF \
  -DMBEDTLS_FATAL_WARNINGS=OFF
cmake --build "$WORK_DIR/mbedtls-build" --target install --parallel 3

cmake -S "$LIBSSH2_SOURCE" -B "$WORK_DIR/libssh2-build" \
  -DCMAKE_SYSTEM_NAME=iOS \
  -DCMAKE_OSX_SYSROOT=iphoneos \
  -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_INSTALL_PREFIX="$OUTPUT_DIR" \
  -DCMAKE_INSTALL_LIBDIR=lib \
  -DBUILD_STATIC_LIBS=ON \
  -DBUILD_SHARED_LIBS=OFF \
  -DBUILD_EXAMPLES=OFF \
  -DBUILD_TESTING=OFF \
  -DCRYPTO_BACKEND=mbedTLS \
  -DMBEDTLS_INCLUDE_DIR="$OUTPUT_DIR/include" \
  -DMBEDCRYPTO_LIBRARY="$OUTPUT_DIR/lib/libmbedcrypto.a"
cmake --build "$WORK_DIR/libssh2-build" --target install --parallel 3

test -f "$OUTPUT_DIR/include/libssh2.h"
test -f "$OUTPUT_DIR/lib/libssh2.a"
test -f "$OUTPUT_DIR/lib/libmbedcrypto.a"
echo "Built libssh2 $LIBSSH2_VERSION with mbedTLS $MBEDTLS_VERSION for iOS arm64"
