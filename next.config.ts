import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 性能优化配置
  experimental: {
    // 启用 Turbopack（开发环境）
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // 构建优化
  compiler: {
    // 移除 console.log（生产环境）
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // 安全头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // 重定向配置
  async redirects() {
    return [
      // 可以在这里添加重定向规则
    ];
  },

  // 重写配置
  async rewrites() {
    return [
      // 可以在这里添加重写规则
    ];
  },
};

export default nextConfig;
