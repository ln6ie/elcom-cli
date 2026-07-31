#ifndef ELCOMCLI_SSH_BRIDGE_H
#define ELCOMCLI_SSH_BRIDGE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct elcom_ssh_session elcom_ssh_session;

typedef struct {
  const char *host;
  int port;
  const char *username;
  const char *password;
  const char *private_key;
  const char *passphrase;
  const char *expected_fingerprint;
  int timeout_ms;
} elcom_ssh_options;

typedef struct {
  char *stdout_data;
  size_t stdout_len;
  char *stderr_data;
  size_t stderr_len;
  int exit_code;
  int error_code;
  char error_message[256];
} elcom_ssh_result;

int elcom_ssh_get_fingerprint(const elcom_ssh_options *options, char *fingerprint, size_t fingerprint_size);
int elcom_ssh_connect(const elcom_ssh_options *options, elcom_ssh_session **out_session, char *fingerprint, size_t fingerprint_size);
int elcom_ssh_execute(elcom_ssh_session *session, const char *command, size_t max_output_bytes, elcom_ssh_result *result);
void elcom_ssh_cancel(elcom_ssh_session *session);
void elcom_ssh_result_free(elcom_ssh_result *result);
void elcom_ssh_disconnect(elcom_ssh_session *session);

#ifdef __cplusplus
}
#endif

#endif
