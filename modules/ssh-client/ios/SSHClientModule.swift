import ExpoModulesCore
import Foundation
import os.log

public final class SSHClientModule: Module {
  private var sessions: [String: OpaquePointer] = [:]
  private let logger = Logger(subsystem: "com.elcomlab.elcomcli", category: "SSH")

  public func definition() -> ModuleDefinition {
    Name("SSHClientModule")

    AsyncFunction("getHostFingerprint") { (options: [String: Any]) throws -> [String: Any] in
      self.logger.info("getHostFingerprint started host=\(options["host"] as? String ?? "unknown", privacy: .public) port=\(options["port"] as? Int ?? 22, privacy: .public)")
      var nativeOptions = try Self.hostOptions(options)
      var fingerprint = [CChar](repeating: 0, count: 65)
      let result = fingerprint.withUnsafeMutableBufferPointer { buffer in
        elcom_ssh_get_fingerprint(&nativeOptions, buffer.baseAddress, buffer.count)
      }
      Self.freeOptions(nativeOptions)
      guard result == 0 else {
        self.logger.error("getHostFingerprint failed code=\(result, privacy: .public)")
        throw SSHModuleError.native(code: result)
      }
      self.logger.info("getHostFingerprint completed")
      return ["fingerprint": String(cString: fingerprint), "algorithm": "sha256"]
    }

    AsyncFunction("connect") { (options: [String: Any]) throws -> [String: Any] in
      self.logger.info("connect started host=\(options["host"] as? String ?? "unknown", privacy: .public) port=\(options["port"] as? Int ?? 22, privacy: .public)")
      var nativeOptions = try Self.options(options)
      var fingerprint = [CChar](repeating: 0, count: 65)
      var pointer: OpaquePointer?
      let result = fingerprint.withUnsafeMutableBufferPointer { buffer in
        elcom_ssh_connect(&nativeOptions, &pointer, buffer.baseAddress, buffer.count)
      }
      Self.freeOptions(nativeOptions)
      guard result == 0, let pointer else {
        self.logger.error("connect failed code=\(result, privacy: .public)")
        throw SSHModuleError.native(code: result)
      }
      let sessionId = UUID().uuidString
      sessions[sessionId] = pointer
      self.logger.info("connect completed session=\(sessionId, privacy: .public)")
      return ["sessionId": sessionId, "fingerprint": String(cString: fingerprint)]
    }

    AsyncFunction("execute") { (sessionId: String, command: String, options: [String: Any]?) throws -> [String: Any] in
      self.logger.info("execute started session=\(sessionId, privacy: .public) command=\(command, privacy: .private)")
      guard let pointer = sessions[sessionId] else { throw SSHModuleError.sessionNotFound }
      var result = elcom_ssh_result()
      let maxBytes = (options?["maxOutputBytes"] as? Int) ?? 65536
      let code = elcom_ssh_execute(pointer, command, maxBytes, &result)
      let stdout = result.stdout_data.map { String(cString: $0) } ?? ""
      let stderr = result.stderr_data.map { String(cString: $0) } ?? ""
      let exitCode = result.exit_code
      elcom_ssh_result_free(&result)
      self.logger.info("execute completed session=\(sessionId, privacy: .public) code=\(code, privacy: .public) exitCode=\(exitCode, privacy: .public) stdoutBytes=\(stdout.utf8.count, privacy: .public) stderrBytes=\(stderr.utf8.count, privacy: .public)")
      if code != 0 && stdout.isEmpty && stderr.isEmpty {
        self.logger.error("execute failed without output code=\(code, privacy: .public)")
        throw SSHModuleError.native(code: code)
      }
      return ["stdout": stdout, "stderr": stderr, "exitCode": exitCode]
    }

    AsyncFunction("cancel") { (sessionId: String, _commandId: String) throws in
      guard let pointer = sessions[sessionId] else { throw SSHModuleError.sessionNotFound }
      elcom_ssh_cancel(pointer)
    }

    AsyncFunction("disconnect") { (sessionId: String) in
      self.logger.info("disconnect requested session=\(sessionId, privacy: .public)")
      if let pointer = self.sessions.removeValue(forKey: sessionId) { elcom_ssh_disconnect(pointer) }
    }
  }

  private static func options(_ values: [String: Any]) throws -> elcom_ssh_options {
    guard let host = values["host"] as? String, let username = values["username"] as? String else { throw SSHModuleError.invalidOptions }
    return elcom_ssh_options(host: duplicate(host), port: (values["port"] as? Int32) ?? Int32((values["port"] as? Int) ?? 22), username: duplicate(username), password: duplicate(values["password"] as? String), private_key: duplicate(values["privateKey"] as? String), passphrase: duplicate(values["passphrase"] as? String), expected_fingerprint: duplicate(values["expectedFingerprint"] as? String), timeout_ms: Int32((values["connectTimeoutMs"] as? Int) ?? 10000))
  }

  private static func hostOptions(_ values: [String: Any]) throws -> elcom_ssh_options {
    guard let host = values["host"] as? String else { throw SSHModuleError.invalidOptions }
    return elcom_ssh_options(host: duplicate(host), port: Int32((values["port"] as? Int) ?? 22), username: duplicate(""), password: nil, private_key: nil, passphrase: nil, expected_fingerprint: nil, timeout_ms: Int32((values["connectTimeoutMs"] as? Int) ?? 10000))
  }

  private static func duplicate(_ value: String?) -> UnsafeMutablePointer<CChar>? {
    guard let value else { return nil }
    return value.withCString { strdup($0) }
  }

  private static func freeOptions(_ options: elcom_ssh_options) { free(UnsafeMutableRawPointer(mutating: options.host)); free(UnsafeMutableRawPointer(mutating: options.username)); free(UnsafeMutableRawPointer(mutating: options.password)); free(UnsafeMutableRawPointer(mutating: options.private_key)); free(UnsafeMutableRawPointer(mutating: options.passphrase)); free(UnsafeMutableRawPointer(mutating: options.expected_fingerprint)); }
}

private enum SSHModuleError: Error { case invalidOptions; case sessionNotFound; case native(code: Int32) }
