import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// Add nonce to script tags for CSP
Document.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await ctx.defaultGetInitialProps?.(ctx);
  const nonce = (ctx.res?.getHeader('x-nonce') as string) || '';
  
  return {
    ...initialProps,
    nonce,
  };
};
