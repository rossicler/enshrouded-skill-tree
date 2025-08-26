import React from "react";
import Head from "next/head";

const title = "Enshrouded Skill Planner";
const description = "A skill tree planner for the game Enshrouded.";

const CustomHeader = () => {
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
