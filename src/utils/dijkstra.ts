import SkillNodes from "@/constants/Nodes";

interface ShortestPathInfo {
  distance: number;
  path: string[];
}

export const dijkstra = (
  startNodeId: string
): { [key: string]: ShortestPathInfo } => {
  const distances: { [key: string]: number } = {};
  const visited: { [key: string]: boolean } = {};
  const previous: { [key: string]: string | null } = {};

  for (const node in SkillNodes.nodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }

  distances[startNodeId] = 0;

  while (true) {
    let closestNode = null;
    let shortestDistance = Infinity;

    for (const node in distances) {
      if (!visited[node] && distances[node] < shortestDistance) {
        closestNode = node;
        shortestDistance = distances[node];
      }
    }

    if (!closestNode) break;

    visited[closestNode] = true;

    const neighbors = SkillNodes.edges[closestNode] || [];
    for (const neighbor of neighbors) {
      const distance =
        distances[closestNode] +
        SkillNodes.types[SkillNodes.nodes[neighbor].type].cost;
      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        previous[neighbor] = closestNode;
      }
    }
  }

  const shortestPaths: { [key: string]: ShortestPathInfo } = {};
  for (const node in distances) {
    const path: string[] = [];
    let currentNode = node;
    while (currentNode !== startNodeId) {
      path.unshift(currentNode);
      currentNode = previous[currentNode]!;
    }
    path.unshift(startNodeId);
    shortestPaths[node] = {
      distance: distances[node],
      path: path,
    };
  }

  return shortestPaths;
};
