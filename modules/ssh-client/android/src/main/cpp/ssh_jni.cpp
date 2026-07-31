#include <jni.h>
#include <string>
#include <initializer_list>
#include <cstdint>
#include "../../../../native/ssh_bridge.h"

static std::string text(JNIEnv *env, jstring value) {
  if (!value) return {};
  const char *raw = env->GetStringUTFChars(value, nullptr);
  std::string result(raw ? raw : "");
  env->ReleaseStringUTFChars(value, raw);
  return result;
}

static void fail(JNIEnv *env, const char *message) {
  jclass error = env->FindClass("java/lang/IllegalStateException");
  env->ThrowNew(error, message);
}

static elcom_ssh_options make_options(const std::string &host, jint port, const std::string &username,
                                      const std::string &password, const std::string &key,
                                      const std::string &passphrase, const std::string &fingerprint) {
  elcom_ssh_options result{};
  result.host = host.c_str();
  result.port = port;
  result.username = username.c_str();
  result.password = password.empty() ? nullptr : password.c_str();
  result.private_key = key.empty() ? nullptr : key.c_str();
  result.passphrase = passphrase.empty() ? nullptr : passphrase.c_str();
  result.expected_fingerprint = fingerprint.empty() ? nullptr : fingerprint.c_str();
  result.timeout_ms = 10000;
  return result;
}

static jobjectArray strings(JNIEnv *env, std::initializer_list<std::string> values) {
  jclass stringClass = env->FindClass("java/lang/String");
  jobjectArray result = env->NewObjectArray((jsize)values.size(), stringClass, nullptr);
  jsize index = 0;
  for (const auto &value : values) env->SetObjectArrayElement(result, index++, env->NewStringUTF(value.c_str()));
  return result;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_elcomcli_sshclient_SSHClientModule_nativeFingerprint(JNIEnv *env, jobject, jstring hostValue, jint port) {
  std::string host = text(env, hostValue);
  char fingerprint[65]{};
  auto options = make_options(host, port, "", "", "", "", "");
  if (elcom_ssh_get_fingerprint(&options, fingerprint, sizeof(fingerprint)) != 0) {
    fail(env, "SSH_FINGERPRINT_FAILED");
    return nullptr;
  }
  return env->NewStringUTF(fingerprint);
}

extern "C" JNIEXPORT jobjectArray JNICALL
Java_com_elcomcli_sshclient_SSHClientModule_nativeConnect(JNIEnv *env, jobject, jstring hostValue, jint port,
                                                           jstring userValue, jstring passwordValue, jstring keyValue,
                                                           jstring passphraseValue, jstring fingerprintValue) {
  std::string host = text(env, hostValue), username = text(env, userValue), password = text(env, passwordValue);
  std::string key = text(env, keyValue), passphrase = text(env, passphraseValue), fingerprint = text(env, fingerprintValue);
  auto options = make_options(host, port, username, password, key, passphrase, fingerprint);
  elcom_ssh_session *session = nullptr;
  char hash[65]{};
  if (elcom_ssh_connect(&options, &session, hash, sizeof(hash)) != 0 || !session) {
    fail(env, "SSH_CONNECT_FAILED");
    return nullptr;
  }
  return strings(env, {std::to_string((long long)(intptr_t)session), hash});
}

extern "C" JNIEXPORT jobjectArray JNICALL
Java_com_elcomcli_sshclient_SSHClientModule_nativeExecute(JNIEnv *env, jobject, jlong sessionValue,
                                                           jstring commandValue, jint maxBytes) {
  auto *session = (elcom_ssh_session *)(intptr_t)sessionValue;
  std::string command = text(env, commandValue);
  elcom_ssh_result result{};
  int code = elcom_ssh_execute(session, command.c_str(), (size_t)maxBytes, &result);
  std::string stdoutValue = result.stdout_data ? result.stdout_data : "";
  std::string stderrValue = result.stderr_data ? result.stderr_data : result.error_message;
  int exitCode = result.exit_code;
  elcom_ssh_result_free(&result);
  if (code != 0 && stdoutValue.empty() && stderrValue.empty()) {
    fail(env, "SSH_EXEC_FAILED");
    return nullptr;
  }
  return strings(env, {stdoutValue, stderrValue, std::to_string(exitCode)});
}

extern "C" JNIEXPORT void JNICALL
Java_com_elcomcli_sshclient_SSHClientModule_nativeCancel(JNIEnv *, jobject, jlong sessionValue) {
  elcom_ssh_cancel((elcom_ssh_session *)(intptr_t)sessionValue);
}

extern "C" JNIEXPORT void JNICALL
Java_com_elcomcli_sshclient_SSHClientModule_nativeDisconnect(JNIEnv *, jobject, jlong sessionValue) {
  elcom_ssh_disconnect((elcom_ssh_session *)(intptr_t)sessionValue);
}
