require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
configured_root = ENV['ELCOMCLI_LIBSSH2_ROOT']
build_root = File.join(__dir__, '.ios-deps')

candidate_roots = [configured_root, build_root].compact.reject(&:empty?).map do |root|
  File.expand_path(root)
end

libssh2_root = candidate_roots.find do |root|
  File.file?(File.join(root, 'include', 'libssh2.h')) &&
    File.file?(File.join(root, 'lib', 'libssh2.a')) &&
    File.file?(File.join(root, 'lib', 'libmbedcrypto.a'))
end

unless libssh2_root
  raise <<~ERROR
    A valid iOS SSH dependency artifact is required when installing ElcomcliSshClient.
    Set ELCOMCLI_LIBSSH2_ROOT or run scripts/build-ios-ssh-deps.sh before pod install.
    Expected include/libssh2.h, lib/libssh2.a, and lib/libmbedcrypto.a.
  ERROR
end

Pod::Spec.new do |s|
  s.name           = 'ElcomcliSshClient'
  s.version        = package['version']
  s.summary        = 'Secure libssh2 bridge for ElcomCLI'
  s.description    = 'Native Expo module exposing bounded SSH sessions with host-key verification.'
  s.homepage       = 'https://elcomcli.app'
  s.license        = { :type => 'BSD-3-Clause' }
  s.author         = { 'ElcomCLI' => 'engineering@elcomcli.app' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :path => '.' }
  s.source_files   = 'ios/**/*.{swift,h}', 'native/**/*.{c,h}'
  s.public_header_files = 'ios/**/*.h', 'native/**/*.h'
  s.dependency 'ExpoModulesCore'
  s.static_framework = true
  s.requires_arc = true
  s.swift_version = '5.9'
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
