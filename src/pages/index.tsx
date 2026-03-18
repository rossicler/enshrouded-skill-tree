import { GetServerSideProps } from "next";
import Image from "next/image";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

import { classNames } from "@/utils/utils";
import CustomHeader from "@/components/CustomHeader";
import SkillTree from "@/components/SkillTree";
import InitSkills from "@/components/handlers/InitSkills";
import clientPromise from "@/lib/mongodb";
import { getCode } from "@/lib/api/code";
import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setCodeImported } from "@/redux/skills/skills.slice";

type Query = {
  shortCode?: string;
  code?: string;
  focus?: string;
};

type PropsType = {
  code?: string;
  focusNodeId?: string;
  clusterStillProvisioning?: boolean;
  dbAvailable?: boolean;
};

export default function Home({ code, focusNodeId, clusterStillProvisioning, dbAvailable = false }: PropsType) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("common");

  useEffect(() => {
    if (code) {
      dispatch(setCodeImported(code));
    }
  }, [code]);

  if (clusterStillProvisioning) return null;

  return (
    <>
      <CustomHeader />
      <main
        className={classNames(
          "h-screen w-screen max-h-screen max-w-full relative bg-gray-600 flex",
          "items-center justify-center text-white"
        )}
      >
        <Image
          src="/assets/Enshrouded_Skill_Tree_BG.png"
          alt={t("accessibility.backgroundAlt")}
          fill
          className="object-cover object-center"
        />
        <div>
          <SkillTree dbAvailable={dbAvailable} focusNodeId={focusNodeId} />
          <InitSkills />
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const locale = context.locale ?? "en";

  try {
    await clientPromise;
  } catch (e: any) {
    if (e.code === "ENOTFOUND") {
      // cluster is still provisioning
      return {
        props: {
          ...(await serverSideTranslations(locale, ["common", "nodes"])),
          clusterStillProvisioning: true,
        },
      };
    } else {
      // Connection limit or other DB error — render the page without DB features
      return {
        props: {
          ...(await serverSideTranslations(locale, ["common", "nodes"])),
        },
      };
    }
  }

  if (context.query) {
    const { shortCode, code: rawCode = "", focus } = context.query as Query;
    const fullCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
    const code = shortCode ? await getCode(shortCode) : fullCode;
    const focusNodeId = Array.isArray(focus) ? focus[0] : focus;
    return {
      props: {
        ...(await serverSideTranslations(locale, ["common", "nodes"])),
        code,
        ...(focusNodeId ? { focusNodeId } : {}),
        dbAvailable: true,
      },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "nodes"])),
      dbAvailable: true,
    },
  };
};
