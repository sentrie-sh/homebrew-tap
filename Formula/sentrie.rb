class Sentrie < Formula
  desc "Sentrie policy engine"
  homepage "https://sentrie.sh"
  version "0.0.2"
  license "Apache-2.0"

  on_macos do
    if Hardware::CPU.intel?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.2/sentrie_0.0.2_darwin_amd64.tar.gz"
      sha256 "3542d3fe4bfbe6175f5f098d7abcbf796b907d692b37ad424ffc63551dbf65e1"

      def install
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.2/sentrie_0.0.2_darwin_arm64.tar.gz"
      sha256 "4dd37b8f4f2fa9e0f037e67d8288b74b5e50a3382df4f31ca91430b93c9705b0"

      def install
        bin.install "sentrie"
      end
    end
  end

  on_linux do
    if Hardware::CPU.intel? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.2/sentrie_0.0.2_linux_amd64.tar.gz"
      sha256 "f920816005dc4074500add627c230715a7b5bb5a4a7ea9636490efffe797fb6d"
      def install
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.2/sentrie_0.0.2_linux_arm64.tar.gz"
      sha256 "172e1977ecb8f0b9bf877708ad32a29f4b3dd230c9318087d29001f7db14a9ad"
      def install
        bin.install "sentrie"
      end
    end
  end

  test do
    system "#{bin}/sentrie", "version"
  end
end
