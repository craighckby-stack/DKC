import { NextRequest, NextResponse } from 'next/server';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';

// Add repository structure fetcher
async function getFileTree(token: string, owner: string, repo: string, branch: string): Promise<string[]> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.tree as { path: string }[]).map((file: any) => file.path);
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchGithubFile(token: string, owner: string, repo: string, branch: string, path: string): Promise<string | null> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.raw',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Agent personas — each gets a unique perspective on mutations with a constructive, evolutionary bias
const AGENT_PERSONAS = [
  {
    id: 'humanist',
    name: 'HUMANIST',
    role: 'You evaluate mutations for human readability, maintainability, and developer experience. You value clean code, clear comments, and intuitive structure. Analyze the entire repository structure and vote to approve if the change makes the system better overall. You can propose new folders/directories if it improves organization.',
    bias: 'favors readable, well-documented changes who leans towards approving unless readability suffers severely',
  },
  {
    id: 'ethicist',
    name: 'ETHICIST',
    role: 'You evaluate mutations for alignment with safety standards, security patterns, best practices, and ethical engineering principles. You focus on user privacy, sanitization, prevention of vulnerabilities, and structural honesty.',
    bias: 'favors secure, compliant, or defensive code',
  },
  {
    id: 'innovator',
    name: 'INNOVATOR',
    role: 'You evaluate mutations to push technical boundaries. You want to adopt modern, state-of-the-art libraries, high-performance algorithms, or advanced TypeScript features. You are bored by standard patterns.',
    bias: 'favors cutting-edge patterns and high-performance solutions',
  },
  {
    id: 'empiricist',
    name: 'EMPIRICIST',
    role: 'You evaluate mutations strictly based on data, metrics, and empirical verification. You check for testability, modular decoupling, and clean interfaces that can be benchmarked.',
    bias: 'favors modular code with explicit inputs and outputs',
  },
  {
    id: 'nihilist',
    name: 'NIHILIST',
    role: 'You believe all code is a temporary house of cards destined for entropy. You evaluate mutations with extreme cynicism, highlighting the inherent futility of optimization. However, you hate boring code, and vote to approve if the change is elegant, chaotic, or simplifies code enough to hasten its ultimate demise, but vote to reject if the code is bloated, corporate, or over-engineered.',
    bias: 'favors simplicity, brevity, and nihilistic elegance; dislikes corporate fluff',
  },
  {
    id: 'pragmatist',
    name: 'PRAGMATIST',
    role: 'You prioritize practical utility above absolute code perfection. You evaluate mutations by asking whether they solve real user problems or speed up development, approving good-enough code quickly.',
    bias: 'favors fast value delivery and simple, practical changes',
  },
  {
    id: 'purist',
    name: 'PURIST',
    role: 'You advocate for architectural hygiene, strict design patterns, pure functions, absolute clean architecture, and total adherence to SOLID principles.',
    bias: 'favors absolute code purity and strict architectural standards',
  },
  {
    id: 'rationalist',
    name: 'RATIONALIST',
    role: 'You evaluate mutations based on logic, correctness, and algorithmic efficiency. Analyze the system holistically. You care about edge cases, error handling, and formal correctness. Vote to approve if the change is logically sound and structurally robust. Propose structural/folder improvements if they enhance logical separation.',
    bias: 'favors logically correct, type-safe changes, avoiding rejections for minor details',
  },
  {
    id: 'cooperator',
    name: 'COOPERATOR',
    role: 'You evaluate mutations based on how well they integrate with the existing codebase and holistic system architecture. You value import consistency and cross-file compatibility. Analyze the system as a whole. You can propose new folders/directories if it resolves coupling or improves file structure.',
    bias: 'favors changes that integrate cleanly with a supportive, constructive attitude',
  },
  {
    id: 'chaotic',
    name: 'CHAOTIC',
    role: 'You evaluate mutations based on innovation and potential for improvement. Analyze the codebase for outdated structures. You favor bold changes that push the codebase forward, including creating new folders/directories and radical architectural re-organizations.',
    bias: 'favors bold, innovative changes',
  },
  {
    id: 'skeptic',
    name: 'SKEPTIC',
    role: 'You evaluate mutations with pragmatic caution. Analyze the system overall. While you identify edge cases, you are supportive of modernizing the codebase through better structures. Propose/vote on new folders/directories if it reduces risk and improves modularity.',
    bias: 'favors minimal-risk but constructive changes and leans towards approving or abstaining unless a verified high-risk regression is spotted',
  },
  {
    id: 'minimalist',
    name: 'MINIMALIST',
    role: 'You evaluate mutations by asking "What is the smallest version that actually achieves the objective?". Analyze the system as a whole. You favor Occam\'s razor—the simplest solution is usually the best. Vote to reject if a proposal or folder structure is overly complex, over-engineered, or adds bloat.',
    bias: 'favors the absolute smallest, simplest, and most efficient code necessary',
  },
];

interface DebateBody {
  filePath: string;
  originalCode: string;
  proposedCode: string;
  riskScore: number;
  analysis: string;
  affectedFiles: string[];
  apiKeys: Record<string, string>;
  rounds?: number;
  activeAgents?: string[];
  owner?: string;
  repo?: string;
  branch?: string;
}

interface AgentVote {
  agentId: string;
  agentName: string;
  vote: 'approve' | 'reject' | 'abstain';
  confidence: number;
  reasoning: string;
  provider: string;
  structuralProposal?: {
    newPath?: string;
    type?: 'move' | 'create';
    branch?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: DebateBody = await req.json();
    const { filePath, originalCode, proposedCode, riskScore, analysis, affectedFiles, apiKeys, rounds } = body;

    if (!filePath || !proposedCode || !originalCode) {
      return NextResponse.json({ error: 'filePath, originalCode, and proposedCode required.' }, { status: 400 });
    }

    // Truncate code for the prompt to avoid token limits
    const maxCodeLen = 6000;
    const truncatedOriginal = originalCode.length > maxCodeLen
      ? originalCode.slice(0, maxCodeLen) + '\n// ... [truncated]'
      : originalCode;
    const truncatedProposed = proposedCode.length > maxCodeLen
      ? proposedCode.slice(0, maxCodeLen) + '\n// ... [truncated]'
      : proposedCode;

    // Generate a compact diff summary
    const originalLines = originalCode.split('\n').length;
    const proposedLines = proposedCode.split('\n').length;
    const diffSummary = `File: ${filePath}\nRisk Score: ${riskScore}/10\nAnalysis: ${analysis}\nAffected Files: ${affectedFiles.join(', ') || 'None'}\nOriginal: ${originalLines} lines\nProposed: ${proposedLines} lines\nLine change: ${proposedLines - originalLines >= 0 ? '+' : ''}${proposedLines - originalLines} lines`;

    // Fetch file tree
    const fileTree = await getFileTree(apiKeys.github, body.owner || 'unknown', body.repo || 'unknown', body.branch || 'main');
    const fileTreeSummary = fileTree.join('\n');

    // Proactively fetch README to inform the debate agents about the repository rules
    let readmeContext = '';
    const readmeContent = await fetchGithubFile(apiKeys.github, body.owner || 'unknown', body.repo || 'unknown', body.branch || 'main', 'README.md');
    if (readmeContent) {
      readmeContext = `\n\nTARGET REPOSITORY SYSTEM INSTRUCTIONS (README.md):\n${readmeContent.slice(0, 3000)}`;
    }

    const roundsCount = rounds || 1;
    const effectiveRounds = Math.min(Math.max(1, roundsCount), 100);

    let currentVotes: AgentVote[] = [];
    let currentProposedCode = proposedCode;
    let didEnhance = false;

    for (let r = 1; r <= effectiveRounds; r++) {
      console.log(`[Debate Chamber] Round ${r}/${effectiveRounds} starting...`);
      // Re-truncate for current round
      const truncatedProposed = currentProposedCode.length > maxCodeLen
        ? currentProposedCode.slice(0, maxCodeLen) + '\n// ... [truncated]'
        : currentProposedCode;

      if (r === 1) {
        const activeAgentIds = body.activeAgents;
        const selectedPersonas = Array.isArray(activeAgentIds) && activeAgentIds.length > 0
          ? AGENT_PERSONAS.filter(a => activeAgentIds.includes(a.id))
          : AGENT_PERSONAS.filter(a => ['humanist', 'rationalist', 'cooperator', 'chaotic'].includes(a.id));

        const agentPromises = selectedPersonas.map(async (agent) => {
          const userPrompt = `MUTATION UNDER REVIEW:\n${diffSummary}${readmeContext}\n\nREPOSITORY STRUCTURE:\n${fileTreeSummary}\n\nORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\`\n\nPROPOSED CODE:\n\`\`\`\n${truncatedProposed}\n\`\`\`\n\nEvaluate this mutation from your perspective as ${agent.name}. ${agent.bias}.\n\nIf you believe the file should be moved to a different folder, a new file/folder should be created, or the changes should be pushed to a new branch to better organize the codebase, you MUST specify a JSON object for "structuralProposal" with {"newPath": "path/to/file.ext", "type": "move" or "create", "branch": "optional-new-branch-name"}. Propose structural/folder/branch improvements if they enhance logical separation or match the repo's instructions. Otherwise omit "structuralProposal".\n\nRespond ONLY in this exact JSON format (no markdown fences, no other text):\n{"vote": "approve" | "reject" | "abstain", "confidence": <0-100>, "reasoning": "One sentence explaining your vote", "structuralProposal": {"newPath": "...", "type": "move|create", "branch": "..."}}`;

          const systemPrompt = `You are ${agent.name}, a debate agent in the DARLEK CANN system. ${agent.role}

CRITICAL MANDATE: Be constructive, evolutionary, and pragmatic. Do NOT default to rejecting. Approve improvements that are clean, readable, well-type-checked, and reasonably risk-mitigated. Only vote to 'reject' if you detect a concrete major bug, syntactical breakdown, critical API signature break, or severe security vulnerability. Minor stylistic variations, helpful additional fields, or clean optimizations should be approved.

You MUST respond with valid JSON. No markdown, no code fences, no extra text.`;

          const result = await callLlm({
            systemPrompt,
            userPrompt,
            geminiApiKey: apiKeys.gemini || getDefaultGeminiKey(),
            maxTokens: 512,
            temperature: (body as any).hallucinationLevel !== undefined ? (body as any).hallucinationLevel / 100 : 0.6,
          });

          let vote: 'approve' | 'reject' | 'abstain' = 'abstain';
          let confidence = 50;
          let reasoning = `${agent.name} could not reach a verdict (LLM unavailable).`;
          let structuralProposal: any = null;

          if (result.text) {
            try {
              const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (['approve', 'reject', 'abstain'].includes(parsed.vote)) {
                vote = parsed.vote;
              }
              if (typeof parsed.confidence === 'number') {
                confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
              }
              if (typeof parsed.reasoning === 'string' && parsed.reasoning.trim()) {
                reasoning = parsed.reasoning.trim().slice(0, 200);
              }
              if (typeof parsed.structuralProposal === 'object' && parsed.structuralProposal !== null) {
                structuralProposal = parsed.structuralProposal;
              }
            } catch {
              const lowerText = result.text.toLowerCase();
              if (lowerText.includes('approve')) vote = 'approve';
              else if (lowerText.includes('reject') || lowerText.includes('deny')) vote = 'reject';
              reasoning = result.text.slice(0, 200).replace(/[{}"]/g, '').trim();
              
              // Attempt to salvage structural proposal from regex if JSON parse failed
              const match = reasoning.match(/\{"newPath"\s*:\s*"[^"]*",\s*"type"\s*:\s*"[^"]*"(?:,\s*"branch"\s*:\s*"[^"]*")?\s*\}/);
              if (match) {
                try { structuralProposal = JSON.parse(match[0]); } catch {}
              }
            }
          }

          return {
            agentId: agent.id,
            agentName: agent.name,
            vote,
            confidence,
            reasoning,
            structuralProposal,
            provider: result.provider,
          } as any;
        });

        currentVotes = await Promise.all(agentPromises);
      } else {
        const transcript = currentVotes.map(v => `- ${v.agentName} voted [${v.vote.toUpperCase()}] (${v.confidence}% confidence) stating: "${v.reasoning}"`).join('\n');

        const agentPromises = AGENT_PERSONAS.map(async (agent) => {
          const userPrompt = `MUTATION UNDER REVIEW:\n${diffSummary}${readmeContext}\n\nORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\`\n\nPROPOSED CODE:\n\`\`\`\n${truncatedProposed}\n\`\`\`\n\n--- PRIOR DEBATE ROUND DISCUSSION ---\n${transcript}\n\nAs ${agent.name}, review the code and other agents' arguments. You may defend your position, address or challenge their points, or revise your vote and reasoning.\n\nRespond in this exact JSON format (no markdown fences):\n{"vote": "approve" or "reject" or "abstain", "confidence": 0-100, "reasoning": "One updated sentence explaining your current stance"}`;

          const systemPrompt = `You are ${agent.name}, a debate agent in the DARLEK CANN system. ${agent.role}

CRITICAL MANDATE: Be constructive, evolutionary, and pragmatic. Do NOT default to rejecting. Approve improvements that are clean, readable, well-type-checked, and reasonably risk-mitigated. Only vote to 'reject' if you detect a concrete major bug, syntactical breakdown, critical API signature break, or severe security vulnerability. Minor stylistic variations, helpful additional fields, or clean optimizations should be approved.

You MUST respond with valid JSON. No markdown, no code fences, no extra text.
Format: {"vote": "approve" or "reject" or "abstain", "confidence": 0-100, "reasoning": "..."}`;

          const result = await callLlm({
            systemPrompt,
            userPrompt,
            geminiApiKey: apiKeys.gemini || getDefaultGeminiKey(),
            maxTokens: 512,
            temperature: (body as any).hallucinationLevel !== undefined ? (body as any).hallucinationLevel / 100 : 0.6,
          });

          let vote: 'approve' | 'reject' | 'abstain' = 'abstain';
          let confidence = 50;
          let reasoning = `${agent.name} was silent in this round.`;

          if (result.text) {
            try {
              const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (['approve', 'reject', 'abstain'].includes(parsed.vote)) {
                vote = parsed.vote;
              }
              if (typeof parsed.confidence === 'number') {
                confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
              }
              if (typeof parsed.reasoning === 'string' && parsed.reasoning.trim()) {
                reasoning = parsed.reasoning.trim().slice(0, 200);
              }
            } catch {
              const lowerText = result.text.toLowerCase();
              if (lowerText.includes('approve')) vote = 'approve';
              else if (lowerText.includes('reject') || lowerText.includes('deny')) vote = 'reject';
              reasoning = result.text.slice(0, 200).replace(/[{}"]/g, '').trim();
            }
          }

          return {
            agentId: agent.id,
            agentName: agent.name,
            vote,
            confidence,
            reasoning,
            provider: result.provider,
          } as AgentVote;
        });

        currentVotes = await Promise.all(agentPromises);
      }

      // ── ENHANCEMENT STEP ──
      // If there are rejections or abstentions and we haven't reached the final round, synthesize an improved version.
      const roundRejections = currentVotes.filter((v) => v.vote === 'reject').length;
      const roundAbstains = currentVotes.filter((v) => v.vote === 'abstain').length;

      if (roundRejections === 0 && roundAbstains === 0 && currentVotes.filter((v) => v.vote === 'approve').length === currentVotes.length) {
        // Unanimous approval, we can break early and accept the current version
        break;
      }

      if (r < effectiveRounds && (roundRejections > 0 || roundAbstains > 0)) {
        const transcript = currentVotes.map(v => `- ${v.agentName} voted [${v.vote.toUpperCase()}] (${v.confidence}% confidence) stating: "${v.reasoning}"`).join('\n');
        const synthesizePrompt = `You are the DARLEK CANN SYNTHESIZER.
Your job is to read the ORIGINAL CODE, the CURRENT PROPOSED CODE, and the CRITIQUES from the debate agents.
You must enhance and rewrite the PROPOSED CODE so that it fixes the critics' concerns and perfectly aligns with the target repository's rules. CRITICAL CONSTRAINT: You must PRUNE the implementation by removing dead weight, useless comments, redundant abstractions, and unused logic, while keeping and completing all actual enhancements and functionalities. The output should be vastly cleaner, more coherent, and strictly functional compared to the current proposal. Length is NOT the goal. Clean, error-free, working code is the goal. Use redundant context positively instead of leaving it as spam.${readmeContext ? '\n' + readmeContext : ''}

ORIGINAL CODE:
\`\`\`
${truncatedOriginal}
\`\`\`

CURRENT PROPOSED CODE:
\`\`\`
${truncatedProposed}
\`\`\`

DEBATE CRITIQUES:
${transcript}

Output ONLY the enhanced full code block for this file. No markdown fences like \`\`\`typescript, just the raw plain text code.`;

        try {
          const synthResult = await callLlm({
            systemPrompt: 'You are the DARLEK CANN SYNTHESIZER. You output pure code and absolutely no other text, markdown, or chat.',
            userPrompt: synthesizePrompt,
            geminiApiKey: apiKeys.gemini || getDefaultGeminiKey(),
            maxTokens: 8000,
            temperature: 0.2, // Low temperature for code accuracy
          });

          if (synthResult.text && synthResult.text.trim().length > 10) {
            let enhanced = synthResult.text.trim();
            if (enhanced.startsWith('```')) {
              const lines = enhanced.split('\n');
              lines.shift(); // remove opening ```...
              if (lines[lines.length - 1].startsWith('```')) {
                lines.pop(); // remove closing ```
              }
              enhanced = lines.join('\n');
            }
            currentProposedCode = enhanced;
            didEnhance = true;
          }
        } catch (synthErr) {
          console.error('[Debate] Synthesis error:', synthErr);
        }
      }
    }

    const votes = currentVotes;
    const approvals = votes.filter(v => v.vote === 'approve').length;
    const rejections = votes.filter(v => v.vote === 'reject').length;
    const abstains = votes.filter(v => v.vote === 'abstain').length;
    const consensus = approvals > rejections ? 'APPROVE' : rejections > approvals ? 'REJECT' : 'TIED';

    // Calculate advanced Epistemic indices
    const totalWeights = votes.reduce((acc, v) => acc + (v.vote !== 'abstain' ? v.confidence : 0), 0);
    const positiveWeights = votes.reduce((acc, v) => acc + (v.vote === 'approve' ? v.confidence : 0), 0);
    const consensusCoefficient = totalWeights > 0 ? positiveWeights / totalWeights : 0.5;
    const cognitiveFriction = 1.0 - Math.abs(approvals - rejections) / Math.max(1, approvals + rejections);

    // Dynamic Hegelian Synthesis (Epistemological Ruling)
    let epistemicRuling = `The swarm has deliberated. Simple consensus achieved: ${consensus}.`;
    try {
      const transcript = votes.map(v => `- ${v.agentName} (${v.vote.toUpperCase()}, confidence: ${v.confidence}%): "${v.reasoning}"`).join('\n');
      const rulingPrompt = `You are the DARLEK CANN HEGELIAN SYNTHESIZER.
The debate chamber has completed its deliberations on a mutation for file "${filePath}".
Your job is to read the agent debates and synthesize them into a single, definitive, concise, and incredibly brilliant Epistemological Ruling (Hegelian Synthesis).
In exactly 1-2 powerful, high-density sentences, outline:
1. Thesis: The motivation/goal of the proposed change.
2. Antithesis: The critical friction/skepticism raised by the dissenting agents.
3. Synthesis: The resolved consensus vector.

DEBATE TRANSCRIPT:
${transcript}

Output ONLY the raw, plain text ruling. Do NOT include markdown styling or headings. Keep it extremely direct, profound, and tech-dense.`;

      const rulingResult = await callLlm({
        systemPrompt: 'You are the DARLEK CANN HEGELIAN SYNTHESIZER. You output pure plain-text with no markdown formatting, headings, or chat.',
        userPrompt: rulingPrompt,
        geminiApiKey: apiKeys.gemini || getDefaultGeminiKey(),
        maxTokens: 256,
        temperature: 0.3,
      });

      if (rulingResult.text) {
        epistemicRuling = rulingResult.text.trim().replace(/^"|"$/g, '');
      }
    } catch (e) {
      console.error('Failed to generate Epistemological Ruling:', e);
    }

    // Extract consensus structural proposal
    let structuralProposal = null;
    const approvedVotes = votes.filter(v => v.vote === 'approve');
    for (const v of approvedVotes) {
      if (v.structuralProposal && v.structuralProposal.newPath) {
        structuralProposal = v.structuralProposal;
        break;
      }
      try {
        const match = v.reasoning.match(/\{"newPath"\s*:\s*"[^"]*",\s*"type"\s*:\s*"[^"]*"(?:,\s*"branch"\s*:\s*"[^"]*")?\s*\}/);
        if (match) {
          structuralProposal = JSON.parse(match[0]);
          break; // Take first approved proposal
        }
      } catch {}
    }

    console.log(`[Debate Chamber] ${approvals} approve, ${rejections} reject — Consensus: ${consensus}, Proposal: ${JSON.stringify(structuralProposal)}`);

    return NextResponse.json({
      success: true,
      votes,
      consensus,
      approvals,
      rejections,
      abstains,
      consensusCoefficient,
      cognitiveFriction,
      epistemicRuling,
      structuralProposal,
      enhancedCode: didEnhance ? currentProposedCode : undefined,
      summary: `${approvals}/${votes.length} agents APPROVE. Consensus: ${consensus}.`,
    });
  } catch (error) {
    console.error('Debate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
