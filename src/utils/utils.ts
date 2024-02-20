import SkillNodes from "../constants/Nodes";

type LineToDrawType = [string, string];

export const getLinesToDraw = () => {
  const linesSet = new Set<string>();
  Object.entries(SkillNodes.edges).forEach(([from, toList]) => {
    toList.forEach((to) => {
      if (linesSet.has(`${to}-${from}`)) return;
      linesSet.add(`${from}-${to}`);
    });
  });
  const linesToDraw: LineToDrawType[] = [];
  linesSet.forEach((val) => {
    const arr = val.split("-");
    if (arr.length === 2) {
      linesToDraw.push([arr[0], arr[1]]);
    }
  });
  return linesToDraw;
};
