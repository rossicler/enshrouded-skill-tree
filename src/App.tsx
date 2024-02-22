import "react-tooltip/dist/react-tooltip.css";
import SkillTree from "./components/SkillTree";
import { classNames } from "./utils/utils";
import HUD from "./components/HUD";

function App() {
  const importHandler = () => {};
  const exportHandler = () => {};

  return (
    <div
      className={classNames(
        "h-screen w-screen max-h-screen max-w-full relative bg-gray-600 flex",
        "items-center justify-center text-white wrapper bg-cover"
      )}
      style={{
        backgroundImage: `url(./assets/Enshrouded_Skill_Tree_BG.png)`,
      }}
    >
      <HUD onImport={importHandler} onExport={exportHandler} />
      <SkillTree />
    </div>
  );
}

export default App;
