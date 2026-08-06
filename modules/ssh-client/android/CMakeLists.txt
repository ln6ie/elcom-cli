cmake_minimum_required(VERSION 3.22.1)
project(sshclient_jni)

include(FetchContent)

# Mobile builds must not link the developer machine's libssh2. When an
# internal artifact is not supplied, fetch the exact audited source releases
# and build both libraries for the current Android ABI.
if(NOT LIBSSH2_ROOT)
  set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
  set(ENABLE_PROGRAMS OFF CACHE BOOL "" FORCE)
  set(ENABLE_TESTING OFF CACHE BOOL "" FORCE)
  set(MBEDTLS_FATAL_WARNINGS OFF CACHE BOOL "" FORCE)

  FetchContent_Declare(
    mbedtls
    URL https://github.com/Mbed-TLS/mbedtls/releases/download/mbedtls-3.6.4/mbedtls-3.6.4.tar.bz2
    URL_HASH SHA256=ec35b18a6c593cf98c3e30db8b98ff93e8940a8c4e690e66b41dfc011d678110
  )
  FetchContent_MakeAvailable(mbedtls)

  FetchContent_Declare(
    libssh2
    URL https://github.com/libssh2/libssh2/releases/download/libssh2-1.11.1/libssh2-1.11.1.tar.gz
    URL_HASH SHA256=d9ec76cbe34db98eec3539fe2c899d26b0c837cb3eb466a56b0f109cabf658f7
  )
  FetchContent_GetProperties(mbedtls)
  FetchContent_GetProperties(libssh2)
  if(NOT libssh2_POPULATED)
    FetchContent_Populate(libssh2)
  endif()

  set(CRYPTO_BACKEND mbedTLS CACHE STRING "" FORCE)
  set(BUILD_STATIC_LIBS ON CACHE BOOL "" FORCE)
  set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
  set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
  set(BUILD_TESTING OFF CACHE BOOL "" FORCE)
  set(MBEDTLS_INCLUDE_DIR "${mbedtls_SOURCE_DIR}/include" CACHE PATH "" FORCE)
  set(MBEDCRYPTO_LIBRARY "${mbedtls_BINARY_DIR}/library/libmbedcrypto.a" CACHE FILEPATH "" FORCE)
  add_subdirectory("${libssh2_SOURCE_DIR}" "${libssh2_BINARY_DIR}" EXCLUDE_FROM_ALL)

  add_library(elcomcli_ssh STATIC ../native/ssh_bridge.c)
  target_include_directories(elcomcli_ssh PUBLIC ../native "${mbedtls_SOURCE_DIR}/include" "${libssh2_SOURCE_DIR}/include")
  target_link_libraries(elcomcli_ssh PRIVATE libssh2_static mbedcrypto)
else()
  add_library(elcomcli_ssh STATIC ../native/ssh_bridge.c)
endif()

add_library(sshclient_jni SHARED src/main/cpp/ssh_jni.cpp)
target_include_directories(sshclient_jni PRIVATE ../native)
target_link_libraries(sshclient_jni elcomcli_ssh log)

# Google Play requires native ELF segments to support 16 KB memory pages.
# Keep this explicit for builds using an older toolchain or cached CMake output.
if(ANDROID)
  target_link_options(sshclient_jni PRIVATE "-Wl,-z,max-page-size=16384")
endif()

if(LIBSSH2_ROOT)
  find_path(LIBSSH2_INCLUDE_DIR libssh2.h PATHS "${LIBSSH2_ROOT}/include" NO_DEFAULT_PATH REQUIRED)
  find_library(LIBSSH2_LIBRARY NAMES ssh2 libssh2 PATHS "${LIBSSH2_ROOT}/lib" NO_DEFAULT_PATH REQUIRED)
  target_include_directories(elcomcli_ssh PUBLIC ../native "${LIBSSH2_INCLUDE_DIR}")
  target_link_libraries(elcomcli_ssh PRIVATE "${LIBSSH2_LIBRARY}")
endif()
