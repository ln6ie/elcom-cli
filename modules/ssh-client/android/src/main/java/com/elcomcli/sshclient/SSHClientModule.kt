package com.elcomcli.sshclient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SSHClientModule : Module() {
  init { System.loadLibrary("sshclient_jni") }

  override fun definition() = ModuleDefinition {
    Name("SSHClientModule")

    AsyncFunction("getHostFingerprint") { options: Map<String, Any?> ->
      val values = options.toNativeOptions()
      mapOf("fingerprint" to nativeFingerprint(values.host, values.port), "algorithm" to "sha256")
    }

    AsyncFunction("connect") { options: Map<String, Any?> ->
      val values = options.toNativeOptions()
      val connected = nativeConnect(values.host, values.port, values.username, values.password, values.privateKey, values.passphrase, values.expectedFingerprint)
      mapOf("sessionId" to connected[0], "fingerprint" to connected[1])
    }

    AsyncFunction("execute") { sessionId: String, command: String, options: Map<String, Any?>? ->
      val maxBytes = (options?.get("maxOutputBytes") as? Number)?.toInt() ?: 65536
      val result = nativeExecute(sessionId.toLong(), command, maxBytes)
      mapOf("stdout" to result[0], "stderr" to result[1], "exitCode" to result[2].toInt())
    }

    AsyncFunction("cancel") { sessionId: String, _: String -> nativeCancel(sessionId.toLong()) }
    AsyncFunction("disconnect") { sessionId: String -> nativeDisconnect(sessionId.toLong()) }
  }

  private external fun nativeFingerprint(host: String, port: Int): String
  private external fun nativeConnect(host: String, port: Int, username: String, password: String?, privateKey: String?, passphrase: String?, fingerprint: String?): Array<String>
  private external fun nativeExecute(sessionId: Long, command: String, maxBytes: Int): Array<String>
  private external fun nativeCancel(sessionId: Long)
  private external fun nativeDisconnect(sessionId: Long)

  private data class NativeOptions(val host: String, val port: Int, val username: String, val password: String?, val privateKey: String?, val passphrase: String?, val expectedFingerprint: String?)
  private fun Map<String, Any?>.toNativeOptions() = NativeOptions(get("host") as String, (get("port") as? Number)?.toInt() ?: 22, get("username") as String, get("password") as? String, get("privateKey") as? String, get("passphrase") as? String, get("expectedFingerprint") as? String)
}
