
class SentrieAT0 < Formula
  desc "Sentrie policy engine"
  homepage "https://sentrie.sh"
  version "0.0.3"
  license "Apache-2.0"

  on_macos do
    if Hardware::CPU.intel?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.3/sentrie_0.0.3_darwin_amd64.tar.gz"
      sha256 "b63d58bdca986df92bdab6f413df15afe5dfb76504fe52a2c565d245c2179d25"

      define_method(:install) do
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.3/sentrie_0.0.3_darwin_arm64.tar.gz"
      sha256 "72f84b76b2a9a20ce19d6ec36e3e9de642134c31b162797a74703a7349242837"

      define_method(:install) do
        bin.install "sentrie"
      end
    end
  end

  on_linux do
    if Hardware::CPU.intel? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.3/sentrie_0.0.3_linux_amd64.tar.gz"
      sha256 "cc4b1e0de470662a21ff780e5e7e151d92b8349a4be24667d9dcf8614e43fb5c"
      define_method(:install) do
        bin.install "sentrie"
      end
    end
    if Hardware::CPU.arm? && Hardware::CPU.is_64_bit?
      url "https://github.com/sentrie-sh/sentrie/releases/download/v0.0.3/sentrie_0.0.3_linux_arm64.tar.gz"
      sha256 "21d493d2d47dc9cba03fc59f2daa92ebe3397c08746efefbd8f2705825d46cd1"
      define_method(:install) do
        bin.install "sentrie"
      end
    end
  end

  test do
    system "#{bin}/sentrie", "version"
  end
end
