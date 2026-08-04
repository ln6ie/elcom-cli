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

The root must contain `include/libssh2.h`, `lib/libssh2.a`, and
`lib/libmbedcrypto.a`. For a local iOS device build, prepare the artifact with:

```sh
pnpm build:deps:ios
npx expo run:ios --device
```

EAS iOS builds run the same dependency preparation automatically through the
`eas-build-pre-install` hook. GitHub's release workflow builds the artifact in
the runner's temporary directory and passes it to CocoaPods through
`ELCOMCLI_LIBSSH2_ROOT`. This separation is intentional: crypto and SSH
libraries must be pinned and reproducibly built before shipping a production
binary.
