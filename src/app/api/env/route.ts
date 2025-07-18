export const dynamic = "force-dynamic"; // Ensure this route is not statically generated
export async function GET() {
  return new Response(JSON.stringify({
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
