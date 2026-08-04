#if !defined(_WIN32)
#define _POSIX_C_SOURCE 200112L
#endif
#include "ssh_bridge.h"

#include <libssh2.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#if defined(__ANDROID__)
#include <android/log.h>
#define SSH_LOG(level, format, ...) __android_log_print(level, "ElcomCLI-SSH", format, ##__VA_ARGS__)
#elif defined(__APPLE__)
#include <os/log.h>
#define ANDROID_LOG_DEBUG 0
#define ANDROID_LOG_WARN 1
#define ANDROID_LOG_ERROR 2
static os_log_t elcom_ssh_logger(void) {
  static os_log_t logger;
  if (!logger) logger = os_log_create("com.elcomlab.elcomcli", "SSH");
  return logger;
}
static os_log_type_t elcom_ssh_log_type(int level) {
  if (level == 2) return OS_LOG_TYPE_ERROR;
  if (level == 1) return OS_LOG_TYPE_INFO;
  return OS_LOG_TYPE_DEBUG;
}
#define SSH_LOG(level, format, ...) os_log_with_type(elcom_ssh_logger(), elcom_ssh_log_type(level), format, ##__VA_ARGS__)
#else
#define ANDROID_LOG_DEBUG 0
#define ANDROID_LOG_WARN 1
#define ANDROID_LOG_ERROR 2
#define SSH_LOG(level, format, ...) fprintf(stderr, "[ElcomCLI-SSH] " format "\n", ##__VA_ARGS__)
#endif

#if defined(_WIN32)
#include <winsock2.h>
#else
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <netdb.h>
#include <unistd.h>
#endif

struct elcom_ssh_session {
  LIBSSH2_SESSION *session;
  int socket_fd;
  volatile int cancelled;
};

static void set_error(elcom_ssh_result *result, int code, const char *message) {
  if (!result) return;
  result->error_code = code;
  snprintf(result->error_message, sizeof(result->error_message), "%s", message ? message : "SSH error");
}

static int open_socket(const char *host, int port, int timeout_ms) {
  char port_string[16];
  snprintf(port_string, sizeof(port_string), "%d", port);
  struct addrinfo hints;
  memset(&hints, 0, sizeof(hints));
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_family = AF_UNSPEC;
  struct addrinfo *addresses = NULL;
  int address_result = getaddrinfo(host, port_string, &hints, &addresses);
  if (address_result != 0) {
    SSH_LOG(ANDROID_LOG_ERROR, "DNS failed host=%s port=%d code=%d", host, port, address_result);
    return -1;
  }
  int fd = -1;
  for (struct addrinfo *address = addresses; address; address = address->ai_next) {
    fd = (int)socket(address->ai_family, address->ai_socktype, address->ai_protocol);
    if (fd < 0) continue;
    SSH_LOG(ANDROID_LOG_DEBUG, "Connecting host=%s port=%d timeoutMs=%d", host, port, timeout_ms);

#if defined(_WIN32)
    int connected = connect(fd, address->ai_addr, (int)address->ai_addrlen) == 0;
    int timed_out = 0;
    int socket_error = 0;
#else
    int original_flags = fcntl(fd, F_GETFL, 0);
    if (timeout_ms > 0 && original_flags >= 0) fcntl(fd, F_SETFL, original_flags | O_NONBLOCK);
    int connect_result = connect(fd, address->ai_addr, (socklen_t)address->ai_addrlen);
    int connected = connect_result == 0;
    int timed_out = 0;
    int socket_error = connect_result == 0 ? 0 : errno;
    if (!connected && timeout_ms > 0 && (errno == EINPROGRESS || errno == EWOULDBLOCK)) {
      fd_set writable;
      FD_ZERO(&writable);
      FD_SET(fd, &writable);
      struct timeval timeout = { timeout_ms / 1000, (timeout_ms % 1000) * 1000 };
      int selected = select(fd + 1, NULL, &writable, NULL, &timeout);
      if (selected == 0) timed_out = 1;
      if (selected > 0 && FD_ISSET(fd, &writable)) {
        socklen_t error_length = sizeof(socket_error);
        getsockopt(fd, SOL_SOCKET, SO_ERROR, &socket_error, &error_length);
        connected = socket_error == 0;
      }
    }
    if (original_flags >= 0) fcntl(fd, F_SETFL, original_flags);
#endif

    if (connected) {
      SSH_LOG(ANDROID_LOG_DEBUG, "Socket connected host=%s port=%d", host, port);
      if (timeout_ms > 0) {
        struct timeval timeout = { timeout_ms / 1000, (timeout_ms % 1000) * 1000 };
        setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
        setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));
      }
      break;
    }
    if (timed_out) {
      SSH_LOG(ANDROID_LOG_WARN, "Socket connection timed out host=%s port=%d timeoutMs=%d", host, port, timeout_ms);
    } else {
      SSH_LOG(ANDROID_LOG_WARN, "Socket connection failed host=%s port=%d socketError=%d", host, port, socket_error);
    }
#if defined(_WIN32)
    closesocket(fd);
#else
    close(fd);
#endif
    fd = -1;
  }
  freeaddrinfo(addresses);
  return fd;
}

static int fingerprint_hex(LIBSSH2_SESSION *session, char *output, size_t output_size) {
  const unsigned char *hash = (const unsigned char *)libssh2_hostkey_hash(session, LIBSSH2_HOSTKEY_HASH_SHA256);
  if (!hash || output_size < 65) return -1;
  for (size_t i = 0; i < 32; i++) snprintf(output + i * 2, output_size - i * 2, "%02x", hash[i]);
  output[64] = '\0';
  return 0;
}

static int create_session(const elcom_ssh_options *options, elcom_ssh_session **out, char *fingerprint, size_t fingerprint_size, int authenticate) {
  if (!options || !options->host || !out || (authenticate && !options->username)) return -2;
  SSH_LOG(ANDROID_LOG_DEBUG, "Creating SSH session host=%s port=%d authenticate=%d", options->host, options->port, authenticate);
  if (libssh2_init(0) != 0) { SSH_LOG(ANDROID_LOG_ERROR, "libssh2_init failed"); return -3; }
  int fd = open_socket(options->host, options->port > 0 ? options->port : 22, options->timeout_ms);
  if (fd < 0) { SSH_LOG(ANDROID_LOG_ERROR, "Socket open failed host=%s port=%d", options->host, options->port); return -4; }
  LIBSSH2_SESSION *ssh = libssh2_session_init();
  if (!ssh) { SSH_LOG(ANDROID_LOG_ERROR, "libssh2 session allocation failed"); close(fd); return -5; }
  libssh2_session_set_blocking(ssh, 1);
  int handshake_result = libssh2_session_handshake(ssh, fd);
  if (handshake_result != 0) {
    char *error_message = NULL;
    int error_code = 0;
    libssh2_session_last_error(ssh, &error_message, &error_code, 0);
    SSH_LOG(ANDROID_LOG_ERROR, "SSH handshake failed code=%d libssh2=%d message=%s", handshake_result, error_code, error_message ? error_message : "unknown");
    libssh2_session_free(ssh); close(fd); return -6;
  }
  SSH_LOG(ANDROID_LOG_DEBUG, "SSH handshake completed host=%s", options->host);
  if (fingerprint_hex(ssh, fingerprint, fingerprint_size) != 0) { SSH_LOG(ANDROID_LOG_ERROR, "SSH fingerprint extraction failed"); libssh2_session_disconnect(ssh, "fingerprint failure"); libssh2_session_free(ssh); close(fd); return -7; }
  SSH_LOG(ANDROID_LOG_DEBUG, "SSH fingerprint received host=%s", options->host);
  if (options->expected_fingerprint && strcmp(options->expected_fingerprint, fingerprint) != 0) { SSH_LOG(ANDROID_LOG_ERROR, "SSH fingerprint mismatch host=%s", options->host); libssh2_session_disconnect(ssh, "host key mismatch"); libssh2_session_free(ssh); close(fd); return -8; }
  if (!authenticate) { SSH_LOG(ANDROID_LOG_DEBUG, "SSH fingerprint check completed host=%s", options->host); libssh2_session_disconnect(ssh, "fingerprint only"); libssh2_session_free(ssh); close(fd); return 0; }
  int auth_result = -1;
  if (options->password) auth_result = libssh2_userauth_password(ssh, options->username, options->password);
  else if (options->private_key) auth_result = libssh2_userauth_publickey_frommemory(ssh, options->username, strlen(options->username), NULL, 0, options->private_key, strlen(options->private_key), options->passphrase);
  if (auth_result != 0) { SSH_LOG(ANDROID_LOG_ERROR, "SSH authentication failed host=%s code=%d", options->host, auth_result); libssh2_session_disconnect(ssh, "authentication failure"); libssh2_session_free(ssh); close(fd); return -9; }
  SSH_LOG(ANDROID_LOG_DEBUG, "SSH authentication completed host=%s", options->host);
  elcom_ssh_session *created = (elcom_ssh_session *)calloc(1, sizeof(elcom_ssh_session));
  if (!created) { libssh2_session_disconnect(ssh, "allocation failure"); libssh2_session_free(ssh); close(fd); return -10; }
  created->session = ssh;
  created->socket_fd = fd;
  *out = created;
  return 0;
}

int elcom_ssh_get_fingerprint(const elcom_ssh_options *options, char *fingerprint, size_t fingerprint_size) {
  elcom_ssh_session *unused = NULL;
  return create_session(options, &unused, fingerprint, fingerprint_size, 0);
}

int elcom_ssh_connect(const elcom_ssh_options *options, elcom_ssh_session **out_session, char *fingerprint, size_t fingerprint_size) {
  return create_session(options, out_session, fingerprint, fingerprint_size, 1);
}

int elcom_ssh_execute(elcom_ssh_session *session, const char *command, size_t max_output_bytes, elcom_ssh_result *result) {
  if (!session || !command || !result) return -2;
  SSH_LOG(ANDROID_LOG_DEBUG, "Executing SSH command maxOutputBytes=%zu", max_output_bytes);
  memset(result, 0, sizeof(*result));
  LIBSSH2_CHANNEL *channel = libssh2_channel_open_session(session->session);
  if (!channel) {
    SSH_LOG(ANDROID_LOG_ERROR, "SSH channel open failed");
    set_error(result, -1, "SSH_CHANNEL_OPEN_FAILED");
    return -1;
  }
  if (libssh2_channel_exec(channel, command) != 0) {
    SSH_LOG(ANDROID_LOG_ERROR, "SSH command start failed");
    set_error(result, -2, "SSH_COMMAND_START_FAILED");
    libssh2_channel_free(channel);
    return -2;
  }
  size_t capacity = max_output_bytes > 0 ? max_output_bytes : 65536;
  result->stdout_data = (char *)calloc(1, capacity + 1);
  result->stderr_data = (char *)calloc(1, capacity + 1);
  if (!result->stdout_data || !result->stderr_data) {
    SSH_LOG(ANDROID_LOG_ERROR, "SSH output allocation failed maxOutputBytes=%zu", capacity);
    set_error(result, -3, "SSH_OUTPUT_ALLOCATION_FAILED");
    libssh2_channel_free(channel);
    elcom_ssh_result_free(result);
    return -3;
  }
  char buffer[4096];
  ssize_t count;
  while (!session->cancelled && (count = libssh2_channel_read(channel, buffer, sizeof(buffer))) > 0) {
    size_t copy = (size_t)count < capacity - result->stdout_len ? (size_t)count : capacity - result->stdout_len;
    memcpy(result->stdout_data + result->stdout_len, buffer, copy); result->stdout_len += copy;
  }
  while (!session->cancelled && (count = libssh2_channel_read_stderr(channel, buffer, sizeof(buffer))) > 0) {
    size_t copy = (size_t)count < capacity - result->stderr_len ? (size_t)count : capacity - result->stderr_len;
    memcpy(result->stderr_data + result->stderr_len, buffer, copy); result->stderr_len += copy;
  }
  result->stdout_data[result->stdout_len] = '\0'; result->stderr_data[result->stderr_len] = '\0';
  result->exit_code = libssh2_channel_get_exit_status(channel);
  if (session->cancelled) set_error(result, -4, "SSH_COMMAND_CANCELLED");
  libssh2_channel_send_eof(channel); libssh2_channel_wait_eof(channel); libssh2_channel_free(channel);
  session->cancelled = 0;
  SSH_LOG(ANDROID_LOG_DEBUG, "SSH command completed exitCode=%d stdoutBytes=%zu stderrBytes=%zu errorCode=%d", result->exit_code, result->stdout_len, result->stderr_len, result->error_code);
  return result->error_code ? result->error_code : 0;
}

void elcom_ssh_cancel(elcom_ssh_session *session) { if (session) session->cancelled = 1; }
void elcom_ssh_result_free(elcom_ssh_result *result) { if (!result) return; free(result->stdout_data); free(result->stderr_data); result->stdout_data = NULL; result->stderr_data = NULL; }
void elcom_ssh_disconnect(elcom_ssh_session *session) { if (!session) return; libssh2_session_disconnect(session->session, "application disconnect"); libssh2_session_free(session->session); close(session->socket_fd); free(session); }
