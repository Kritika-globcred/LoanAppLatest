const securityHeaders = [
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: http: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://securetoken.googleapis.com https://www.google-analytics.com",
      "frame-src 'self' https://*.firebaseapp.com https://*.google.com",
      "worker-src 'self' blob:",
      "media-src 'self' data: blob:",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Use default .next directory
  distDir: '.next',
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Enable production source maps
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    domains: ['firebasestorage.googleapis.com'],
    // Enable image optimization for Vercel
    unoptimized: false,
  },
  
  // Enable trailing slashes for better compatibility
  trailingSlash: true,
  
  // Remove experimental features that might cause issues
  // and are not needed for this project
  
  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
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
  },
  // Ensure CSS modules are properly handled
  webpack: (config) => {
    // Important: return the modified config
    return config;
  },
  // Handle TypeScript path aliases for module resolution
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
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
