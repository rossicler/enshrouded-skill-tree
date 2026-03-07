import React from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";

const CustomHeader = () => {
  const { t } = useTranslation("common");
  const title = t("meta.title");
  const description = t("meta.description");

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1232366016476149"
        crossOrigin="anonymous"
      ></script>
      {/* <meta property="og:url" content={baseUrl} /> */}
    </Head>
  );
};

export default CustomHeader;
