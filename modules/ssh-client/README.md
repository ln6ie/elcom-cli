# ElcomCLI SSH client

This is a local Expo module. It keeps SSH implementation out of JavaScript and
exposes a small, bounded API to `SSHConnectionManager`:

- host-key fingerprint discovery (SHA-256)
- authenticated sessions using password or private-key material
- bounded command execution
- cancellation and disconnect

The module requires a pinned, platform-built `libssh2` static library. Do not
link the host machine's `libssh2` into an Android or iOS application. Build the
same libssh2 version for every supported ABI, with the platform crypto backend,
then provide its root to the Android build:

```sh
LIBSSH2_ROOT=/absolute/path/to/android/arm64-v8a \
  ANDROID_HOME=/path/to/android-sdk \
  ./gradlew :app:assembleDebug
```

The root must contain `include/libssh2.h` and `lib/libssh2.a`. iOS should use a
vendored XCFramework or an equivalent static framework and expose the same
headers to the pod. This separation is intentional: crypto and SSH libraries
must be pinned and reproducibly built before shipping a production binary.
