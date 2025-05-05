import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Load Roboto Flex with normal and bold weights for better readability */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@100;400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 