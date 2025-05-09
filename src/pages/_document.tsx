import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* OpenAI base reset & tokens */}
        <link rel="stylesheet" href="/openai-base.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 