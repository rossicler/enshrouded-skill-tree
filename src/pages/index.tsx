import HUD from "@/components/HUD";
import SkillTree from "@/components/SkillTree";
import { classNames } from "@/utils/utils";

export default function Home() {
  const importHandler = () => {};
  const exportHandler = () => {};

  return (
    <main
      className={classNames(
        "h-screen w-screen max-h-screen max-w-full relative bg-gray-600 flex",
        "items-center justify-center text-white wrapper bg-cover relative"
      )}
      style={{
        backgroundImage: `url(./assets/Enshrouded_Skill_Tree_BG.png)`,
      }}
    >
      <div>
        <HUD onImport={importHandler} onExport={exportHandler} />
        <SkillTree />
      </div>
    </main>
  );
}
