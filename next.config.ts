import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Exclude large player bundle files (shots data) from serverless function tracing.
  // These files are only read at build-time by scripts, not at runtime by Next.js pages.
  // The lean pre-built JSON files (sis-intermediates.json, prospects-sis.json, draft-sis-all.json)
  // are imported statically and are fine.
  outputFileTracingExcludes: {
    "/**": [
      "./data/players/**",
    ],
  },
};

export default nextConfig;
