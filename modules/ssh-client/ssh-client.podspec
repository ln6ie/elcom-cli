Pod::Spec.new do |s|
  s.name           = 'ElcomcliSshClient'
  s.version        = '0.1.0'
  s.summary        = 'Secure libssh2 bridge for ElcomCLI'
  s.description    = 'Native Expo module exposing bounded SSH sessions with host-key verification.'
  s.homepage       = 'https://elcomcli.app'
  s.license        = { :type => 'BSD-3-Clause' }
  s.author         = { 'ElcomCLI' => 'engineering@elcomcli.app' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :path => '.' }
  s.source_files   = 'ios/**/*.{swift,h,mm}', 'native/**/*.{c,h}'
  s.public_header_files = 'ios/**/*.h', 'native/**/*.h'
  s.dependency 'ExpoModulesCore'
  s.requires_arc = true
  s.swift_version = '5.0'
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '$(PODS_TARGET_SRCROOT)/native'
  }
end
