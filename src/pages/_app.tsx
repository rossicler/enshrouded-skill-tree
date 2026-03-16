import StoreProvider from "@/redux/StoreProvider";
import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { appWithTranslation } from "next-i18next";

function App({ Component, pageProps }: AppProps) {
  return (
    <StoreProvider>
      <Component {...pageProps} />
      <ToastContainer position="bottom-center" theme="dark" hideProgressBar icon={false} />
    </StoreProvider>
  );
}

export default appWithTranslation(App);
