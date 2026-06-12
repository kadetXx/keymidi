# Homebrew cask for KeyMIDI.
#
# This file lives in the tap repo (github.com/kadetXx/homebrew-tap) as
# Casks/keymidi.rb — the copy here is the template kept with the app source.
#
# Per release: update `version`, then refresh both sha256 values:
#   shasum -a 256 release/KeyMIDI-<version>-arm64.dmg
#   shasum -a 256 release/KeyMIDI-<version>-x64.dmg

cask "keymidi" do
  version "0.2.8"

  on_arm do
    sha256 "b90b452da151f7c45bc450b687aab4e6abafb27917618a693a80c8b1761141f9"
    url "https://github.com/kadetXx/keymidi/releases/download/v#{version}/KeyMIDI-#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "1c182ca5e8625086aad8635f26485601d56ff894d56eac2d62d840cd433a3600"
    url "https://github.com/kadetXx/keymidi/releases/download/v#{version}/KeyMIDI-#{version}-x64.dmg"
  end

  name "KeyMIDI"
  desc "Turn your typing keyboard into a chord-grammar MIDI controller"
  homepage "https://github.com/kadetXx/keymidi"

  app "KeyMIDI.app"

  caveats <<~EOS
    KeyMIDI needs the macOS Accessibility permission for its global
    keyboard hook: System Settings → Privacy & Security → Accessibility
    → enable KeyMIDI.
  EOS
end
