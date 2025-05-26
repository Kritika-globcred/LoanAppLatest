
export async function register() {
  // Sentry initialization removed.
  // Add any other non-Sentry instrumentation here if needed.
  if (process.env.NODE_ENV === 'development') {
    console.log('Custom instrumentation registered (Sentry removed).');
  }
}

// Sentry's onRequestError export removed.
// If you have other request error handling, it can be exported here.
// export const onRequestError = (error: Error, request: Request, response: Response) => {
//   console.error('Request Error:', error);
// };
