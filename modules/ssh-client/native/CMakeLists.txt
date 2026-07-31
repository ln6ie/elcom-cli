cmake_minimum_required(VERSION 3.22)
project(elcomcli_ssh LANGUAGES C)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)

if(LIBSSH2_ROOT)
  find_path(LIBSSH2_INCLUDE_DIR libssh2.h PATHS "${LIBSSH2_ROOT}/include" NO_DEFAULT_PATH)
  find_library(LIBSSH2_LIBRARY NAMES ssh2 libssh2 PATHS "${LIBSSH2_ROOT}/lib" NO_DEFAULT_PATH)
else()
  find_path(LIBSSH2_INCLUDE_DIR libssh2.h)
  find_library(LIBSSH2_LIBRARY NAMES ssh2 libssh2)
endif()

if(NOT LIBSSH2_INCLUDE_DIR OR NOT LIBSSH2_LIBRARY)
  message(FATAL_ERROR "Pinned libssh2 is required. Set LIBSSH2_ROOT to a platform build containing include/libssh2.h and lib/libssh2.a.")
endif()

add_library(elcomcli_ssh STATIC ssh_bridge.c)
target_include_directories(elcomcli_ssh PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}" "${LIBSSH2_INCLUDE_DIR}")
target_link_libraries(elcomcli_ssh PUBLIC "${LIBSSH2_LIBRARY}")
