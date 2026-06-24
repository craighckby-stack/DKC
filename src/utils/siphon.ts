const SOURCES = [
  { owner: "craighckby-stack", repo: "Huxley-Singularity-Loop-Main", branch: "main", label: "SINGULARITY LOOP" },
  { owner: "google-deepmind", repo: "deepmind-research", branch: "master", label: "AGI RESEARCH" },
  { owner: "firebase", repo: "genkit", branch: "main", label: "ORCHESTRATION" },
  { owner: "huggingface", repo: "transformers", branch: "main", label: "ARCHITECTURE" },
];

export async function siphonFetchFile(src: { owner: string; repo: string; branch: string; label: string }, githubToken?: string) {
  try {
    const headers: Record<string, string> = {
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {})
    };
    const res = await fetch(`https://api.github.com/repos/${src.owner}/${src.repo}/git/trees/${src.branch}?recursive=1`, { headers });
    const tree = await res.json();
    if (!tree.tree) return "// No JS/TS files found";
    const files = tree.tree.filter((f: any) => f.type === "blob" && /\.(js|ts)$/.test(f.path));
    if (!files.length) return "// No JS/TS files found";
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const contentRes = await fetch(`https://api.github.com/repos/${src.owner}/${src.repo}/contents/${randomFile.path}?ref=${src.branch}`, { headers });
    const contentData = await contentRes.json();
    if (!contentData || !contentData.content) return "// Failed to read content";
    return decodeURIComponent(escape(atob(contentData.content.replace(/\s/g, "")))).slice(0, 3000);
  } catch {
    return "// Fetch failed";
  }
}

export async function siphonEvolveCycle(baseCode: string, sourceData: string, addLog?: (msg: string) => void) {
  try {
    if (addLog) addLog(`[SIPHON] Identifying structural constraints & working chunks...`);
    const extractRes = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Source to analyze:\n${sourceData}` }],
        systemInstruction: "Identify 3 cohesive and working code chunks or logical algorithms from the source. Format as brief bullet points.",
      }),
    });
    if (!extractRes.ok) return baseCode;
    const extractData = await extractRes.json();
    const chunks = extractData.reply || "";

    if (addLog) addLog(`[SIPHON] Debating chunk viability (Hyperspace Sync)...`);
    const debateRes = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Current App Code:\n${baseCode}\n\nProposed Chunks from external source:\n${chunks}` }],
        systemInstruction: "You are an agent Orchestra. Debate if any of these chunks can mathematically or logically enhance the Current App Code without breaking it. Provide a brief PRO vs CON list and a final unanimous verdict on WHAT to apply.",
      }),
    });
    if (!debateRes.ok) return baseCode;
    const debateData = await debateRes.json();
    const debateOutcome = debateData.reply || "";

    if (addLog) addLog(`[SIPHON] Resolving debate & integrating chosen logic...`);
    const mutRes = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Current Code:\n${baseCode}\n\nDebate Consensus / Instruction:\n${debateOutcome}\n\nTASK: Return the FULL updated code integrating the agreed upon logic. NO markdown. NO explanation.` }],
        systemInstruction: "Output ONLY valid working JavaScript/TypeScript to replace the original file. No wrappers or apologies.",
      }),
    });
    if (!mutRes.ok) return baseCode;
    const mutData = await mutRes.json();
    let mutated = mutData.reply || "";
    
    mutated = mutated.replace(/^