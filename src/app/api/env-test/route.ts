import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose non-sensitive information
  const envVars = {
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return NextResponse.json(envVars);
}
