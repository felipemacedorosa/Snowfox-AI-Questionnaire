import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Snowfox-AI-Questionnaire",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: "/Snowfox-AI-Questionnaire",
  },
  allowedDevOrigins: ["english-col-authorization-pour.trycloudflare.com"],
};

export default nextConfig;
