import "react-tooltip/dist/react-tooltip.css";
import SkillTree from "./components/SkillTree";

function App() {
  return (
    <div
      className="h-screen w-screen max-h-screen max-w-full bg-gray-600 flex items-center justify-center text-white wrapper"
      style={{
        backgroundImage: `url(./assets/Enshrouded_Skill_Tree_BG.png)`,
      }}
    >
      <SkillTree />
    </div>
  );
}

export default App;
