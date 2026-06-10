# Homebrew cask for KeyMIDI.
#
# This file lives in the tap repo (github.com/kadetXx/homebrew-tap) as
# Casks/keymidi.rb — the copy here is the template kept with the app source.
#
# Per release: update `version`, then refresh both sha256 values:
#   shasum -a 256 release/KeyMIDI-<version>-arm64.dmg
#   shasum -a 256 release/KeyMIDI-<version>-x64.dmg
#
# Until the app is signed + notarized, users must install with:
#   brew install --cask --no-quarantine kadetXx/tap/keymidi

cask "keymidi" do
  version "0.1.0"

  on_arm do
    sha256 "REPLACE_WITH_ARM64_DMG_SHA256"
    url "https://github.com/kadetXx/keymidi/releases/download/v#{version}/KeyMIDI-#{version}-arm64.dmg"
  end
  on_intel do
    sha256 "REPLACE_WITH_X64_DMG_SHA256"
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
