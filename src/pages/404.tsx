import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export default function Custom404() {
  const { t } = useTranslation("common");

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-600 text-white">
      <h1>404 - {t("errors.notFound")}</h1>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
