import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // „Wypełnij pola z AI” accepts a PDF up to 8 MB (MAX_PDF_BYTES) plus multipart overhead.
    serverActions: { bodySizeLimit: "9mb" },
  },
};

export default nextConfig;
