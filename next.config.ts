import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF/Word読み取りライブラリはバンドルせず、そのままサーバーで使う
  serverExternalPackages: ["pdf-parse", "mammoth"],
  experimental: {
    // 資料アップロードのため、送れるサイズを10MBまで広げる
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
