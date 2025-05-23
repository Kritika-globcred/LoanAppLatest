module.exports = {
  // Basic configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    // Public environment variables (client-side)
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  
  // Server-side configuration
  serverRuntimeConfig: {
    // These will only be available on the server side
    firebase: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
  },
  
  // Public configuration
  publicRuntimeConfig: {
    // These will be available on both server and client
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
  },
  
  // Images configuration
  images: {
    domains: [
      'firebasestorage.googleapis.com', 
      'lh3.googleusercontent.com',
      'raw.githubusercontent.com',
      'placehold.co'
    ],
  },
  
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Webpack configuration
  webpack: (config) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
}
