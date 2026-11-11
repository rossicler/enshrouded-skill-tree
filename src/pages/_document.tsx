import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    // Next sets lang to the page's locale.
    <Html>
      <Head>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS} />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
