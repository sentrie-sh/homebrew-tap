
class SentrieAT0_0 < Formula
  desc "Sentrie policy engine"
  homepage "https://sentrie.sh"
  version "0.0.4"
  license "Apache-2.0"

  on_macos do
    if Hardware::CPU.intel?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.4/sentrie_0.0.4_darwin_amd64.tar.gz"
      sha256 "4050b7445d6d6361425717528c3235ec85a22548b79ef3e0432eb708415eb5ff"

      define_method(:install) do
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.4/sentrie_0.0.4_darwin_arm64.tar.gz"
      sha256 "bc61b5f604fd6f90cf1923dea1e86d8827d37f081694e3795e081d511be498dd"

      define_method(:install) do
        bin.install "sentrie"
      end
    end
  end

  on_linux do
    if Hardware::CPU.intel? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.4/sentrie_0.0.4_linux_amd64.tar.gz"
      sha256 "2526d105bec3d6a23b0c92e3ce51c89469759cc1093b43c8453aca43cb74a22d"
      define_method(:install) do
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.4/sentrie_0.0.4_linux_arm64.tar.gz"
      sha256 "1a9bf0a520a0a5be645d4dda6025e037bbd0648b2699c0d274b5bd034385193d"
      define_method(:install) do
        bin.install "sentrie"
      end
    end
  end

  test do
    system "#{bin}/sentrie", "version"
  end
end
