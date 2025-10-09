const CopyPlugin = require("copy-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    domains: ["images.unsplash.com", "gglkagcmyfdyojtgrzyv.supabase.co"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.tslfiles.org',
      },
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Copy VAD files for client-side only
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
              to: "static/chunks/[name][ext]",
            },
            {
              from: "node_modules/@ricky0123/vad-web/dist/*.onnx",
              to: "static/chunks/[name][ext]",
            },
            {
              from: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
              to: "static/chunks/[name][ext]"
            },
            {
              from: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm",
              to: "static/chunks/[name][ext]"
            },
          ],
        }),
      );
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

// Only apply Sentry in production
if (process.env.NODE_ENV === 'production') {
  try {
    const { withSentryConfig } = require("@sentry/nextjs");
    
    module.exports = withSentryConfig(nextConfig, {
      org: "luna-the-smart",
      project: "javascript-nextjs",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    });
  } catch (e) {
    // If Sentry is not available, just export the config
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}