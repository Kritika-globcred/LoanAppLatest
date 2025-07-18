# Loan Application Platform

A modern loan application platform built with Next.js and Firebase, deployed on Vercel.

## Features

- User authentication with Firebase Authentication
- Application form with multi-step workflow
- Document upload and storage with Firebase Storage
- Real-time updates with Firestore
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Comprehensive error handling and logging
- Custom error pages with user-friendly messages
- Security headers and CSP protection
- Performance monitoring and analytics

## Error Handling & Logging

### Global Error Handling

- **Error Boundaries**: React Error Boundaries catch JavaScript errors in the component tree.
- **API Error Handling**: Consistent error responses with status codes and error details.
- **Global Error Page**: Custom error page for unhandled exceptions.
- **404 Not Found**: Custom 404 page with helpful navigation.

### Logging

- **Structured Logging**: JSON-formatted logs with timestamps and context.
- **Error Tracking**: Errors are logged with stack traces and relevant context.
- **Performance Monitoring**: Request timing and performance metrics.
- **Security**: Sensitive data is automatically redacted from logs.

### Security

- **CSP Headers**: Content Security Policy to prevent XSS attacks.
- **Security Headers**: Added security headers like X-Content-Type-Options, X-Frame-Options, etc.
- **Nonce-based Script Loading**: For inline scripts to work with strict CSP.

### Environment Variables

Add these to your `.env.local` for enhanced error reporting:

```
# App Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0

# Logging
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_LOG_TO_CONSOLE=true
NEXT_PUBLIC_LOG_TO_FILE=false

# API
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Prerequisites

- Node.js 16.8 or later
- npm or yarn
- Firebase project with Authentication, Firestore, and Storage enabled
- Vercel account

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/loan-app.git
   cd loan-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Import your project to Vercel.
3. Add your Firebase environment variables to the Vercel project settings.
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Floan-app)

## Firebase Emulators (Local Development)

To use Firebase emulators for local development:

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Start the emulators:
   ```bash
   firebase emulators:start
   ```

4. In a separate terminal, run the Next.js development server:
   ```bash
   npm run dev
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
