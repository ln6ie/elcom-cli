# Native SSH dependency contract

The module intentionally does not link against a host operating-system
`libssh2`. Android uses pinned source releases and builds them for the active
ABI when no prebuilt artifact is supplied. iOS still requires a platform-built
artifact because CocoaPods cannot run the Android CMake dependency pipeline.

Build and pin:

- libssh2 1.11.1
- a supported TLS backend (mbedTLS is the mobile default)
- one static artifact per target ABI/architecture

The artifact directory must have this shape:

```text
<target>/
├── include/libssh2.h
└── lib/libssh2.a
```

Android build (automatic pinned source build):

```bash
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

An internal artifact can still be supplied for controlled/offline builds:

```bash
./gradlew :app:assembleDebug \
  -PLIBSSH2_ROOT=/absolute/path/to/android/<abi>
```

iOS CocoaPods integration:

```bash
ELCOMCLI_LIBSSH2_ROOT=/absolute/path/to/ios \
  npx pod-install
```

The build must fail when this dependency is absent. Linking the developer
machine's `/usr/lib/libssh2` would make the app non-reproducible and cannot
produce a valid iOS/Android binary.
