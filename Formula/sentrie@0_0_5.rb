
class SentrieAT0_0_5 < Formula
  desc "Sentrie policy engine"
  homepage "https://sentrie.sh"
  version "0.0.5"
  license "Apache-2.0"

  on_macos do
    if Hardware::CPU.intel?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.5/sentrie_0.0.5_darwin_amd64.tar.gz"
      sha256 "8bb56bae5d756b7afa84accf21990a999c36ef4bae0c9e438c45b0fbc9cebec7"

      define_method(:install) do
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.5/sentrie_0.0.5_darwin_arm64.tar.gz"
      sha256 "75231bf36b50bf8455b7d462beab21ce5e7dac32f3be031a6807b813e08f4833"

      define_method(:install) do
        bin.install "sentrie"
      end
    end
  end

  on_linux do
    if Hardware::CPU.intel? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.5/sentrie_0.0.5_linux_amd64.tar.gz"
      sha256 "434d6e73d884f12950eff4c03e7bd656617277f57901ebdf661caa13840a8d8c"
      define_method(:install) do
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.5/sentrie_0.0.5_linux_arm64.tar.gz"
      sha256 "dae273bca619cb9e3558bc008fad3788806a26806d06d3d657797ddbc36fa4f0"
      define_method(:install) do
        bin.install "sentrie"
      end
    end
  end

  test do
    system "#{bin}/sentrie", "version"
  end
end
