require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
libssh2_root = ENV['ELCOMCLI_LIBSSH2_ROOT']

unless libssh2_root && !libssh2_root.empty?
  raise <<~ERROR
    ELCOMCLI_LIBSSH2_ROOT is required when installing ElcomcliSshClient.
    Provide the pinned iOS libssh2/crypto artifact produced by the native
    dependency build before running pod install.
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
