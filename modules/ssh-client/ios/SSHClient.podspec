require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ElcomCLISSHClient'
  s.version        = package['version']
  s.summary        = 'Native SSH transport for ElcomCLI'
  s.description    = 'Expo module backed by the shared libssh2 transport bridge.'
  s.license        = { :type => 'MIT' }
  s.author         = { 'ElcomCLI' => 'support@elcomcli.dev' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # The libssh2 headers and static library are intentionally supplied by the
  # native dependency pipeline. Keeping them external prevents CocoaPods from
  # silently selecting an unpinned system SSH implementation.
  libssh2_root = ENV['ELCOMCLI_LIBSSH2_ROOT']
  unless libssh2_root && !libssh2_root.empty?
    raise <<~ERROR
      ELCOMCLI_LIBSSH2_ROOT is required when installing ElcomCLISSHClient.
      Provide the pinned iOS libssh2/crypto artifact produced by the native
      dependency build before running pod install.
    ERROR
  end

  s.source_files = [
    '**/*.{h,swift}',
    '../native/ssh_bridge.c',
    '../native/ssh_bridge.h'
  ]
  s.public_header_files = '**/*.h'
  s.header_mappings_dir = '.'
  s.user_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => "$(inherited) \"#{libssh2_root}/include\"",
    'LIBRARY_SEARCH_PATHS' => "$(inherited) \"#{libssh2_root}/lib\"",
    'OTHER_LDFLAGS' => '$(inherited) -lssh2 -lmbedcrypto'
  }
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'HEADER_SEARCH_PATHS' => "$(inherited) \"#{libssh2_root}/include\"",
    'LIBRARY_SEARCH_PATHS' => "$(inherited) \"#{libssh2_root}/lib\"",
    'OTHER_LDFLAGS' => '$(inherited) -lssh2 -lmbedcrypto'
  }
end
