import { GetServerSideProps } from "next";
import Image from "next/image";

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
};

type PropsType = {
  code?: string;
  clusterStillProvisioning?: boolean;
};

export default function Home({ code, clusterStillProvisioning }: PropsType) {
  const dispatch = useAppDispatch();

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
          alt="Purple smoke background"
          fill
          className="object-cover object-center"
        />
        <div>
          <SkillTree />
          <InitSkills />
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    await clientPromise;
  } catch (e: any) {
    if (e.code === "ENOTFOUND") {
      // cluster is still provisioning
      return {
        props: {
          clusterStillProvisioning: true,
        },
      };
    } else {
      throw new Error("Connection limit reached. Please try again later.");
    }
  }

  if (context.query) {
    const { shortCode, code: fullCode = "" } = context.query as Query;
    const code = shortCode ? await getCode(shortCode) : fullCode;
    console.log(code);
    return {
      props: {
        code,
      },
    };
  }
  return {
    props: {},
  };
};
