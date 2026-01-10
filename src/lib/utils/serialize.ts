export function serializeGraph(graph: { nodes: PromptNode[]; edges: Edge[] }) {
  // DFS traverse → {guide: string, prompts: PromptItem[]}
  const prompts: PromptItem[] = [];
  // Impl: topo sort edges → extract data.prompt
  return { guide: 'Built from graph', prompts };
}

export function deserializePromptsToGraph(prompts: PromptItem[]): any {
  // Reverse for visual load
}