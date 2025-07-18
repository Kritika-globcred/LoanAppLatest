/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com",
              "frame-src 'self' https://*.firebaseapp.com https://*.google.com",
              "worker-src 'self' blob:",
              "media-src 'self' data: blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  
  // Use webpack 5
  webpack5: true,
  
  // React Strict Mode
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  
  // Images configuration
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Custom webpack configuration
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    return config;
  }
  },
  // Use default .next directory
  distDir: '.next',
  
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Disable React strict mode during build for better performance
  reactStrictMode: false,
  
  // Optimize images
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: false,
  },
  
  // Enable trailing slashes for better compatibility
  trailingSlash: true,
  
  // Webpack configuration for optimized builds
  webpack: (config, { isServer, dev, webpack }) => {
    // Only optimize in production
    if (!dev) {
      // Client-side only configuration
      if (!isServer) {
        // Ignore server-only modules in client bundle
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          module: false,
          net: false,
          dns: 'mock',
          tls: false,
          child_process: false,
        };
        
        // Ignore problematic modules
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^@opentelemetry\/sdk-node$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^@opentelemetry\/exporter-jaeger$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^dotprompt$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^handlebars$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^genkit$/,
          })
        );
      }
    }
    
    // Ensure CSS modules are properly handled
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    
    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Enable concurrent features
    workerThreads: true,
    // Optimize package imports
    modularizeImports: {
      // Add any large libraries you're using here
      'react-icons': {
        transform: 'react-icons/{{member}}',
      },
    },
  },
  
  // Configure allowed image domains
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'raw.githubusercontent.com',
      'lh3.googleusercontent.com', // For Google profile pictures
      'avatars.githubusercontent.com', // For GitHub avatars
      'placehold.co' // For placeholder images
    ],
  },
};

module.exports = nextConfig;
