import HUD from "@/components/hud/HUD";
import SkillTree from "@/components/SkillTree";
import { classNames } from "@/utils/utils";
import Image from "next/image";

export default function Home() {
  return (
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
        <HUD />
        <SkillTree />
      </div>
    </main>
  );
}
