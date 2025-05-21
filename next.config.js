/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default .next directory
  distDir: '.next',
  
  // Enable React strict mode
  reactStrictMode: true,
  
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
