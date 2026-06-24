import { NextRequest, NextResponse } from 'next/server';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';
import type { ProposeBody } from '@/lib/types';

export const maxDuration = 120;

// Detect if file content is encrypted, binary, or non-code
function isNonCodeContent(content: string): { isNonCode: boolean; reason: string } {
  // Check for encrypted JSON patterns
  if (content.includes('"iv"') && content.includes('"data"') && content.includes('AES')) {
    return { isNonCode: true, reason: 'File appears to be encrypted (AES) data, not source code' };
  }

  const trimmed = content.trim().slice(0, 2000);
  if (trimmed.length < 10) {
    return { isNonCode: false, reason: '' };
  }

  // Common code/markup markers. If any of these are present, it is definitely code/text.
  const hasCodeMarkers = 
    trimmed.includes('{') || 
    trimmed.includes('}') || 
    trimmed.includes(';') || 
    trimmed.includes('const ') || 
    trimmed.includes('import ') || 
    trimmed.includes('export ') || 
    trimmed.includes('function ') || 
    trimmed.includes('class ') || 
    trimmed.includes('//') || 
    trimmed.includes('/*') || 
    trimmed.includes('<div') || 
    trimmed.includes('import(');

  if (hasCodeMarkers) {
    return { isNonCode: false, reason: '' };
  }

  // Base64 encoding uses exactly A-Za-z0-9+/ with possible padding '='.
  // It has newlines occasionally, but NO spaces separating words.
  // Standard formatted base64 has a high concentration of A-Za-z0-9+/= and very few or no regular spaces.
  const base64CharsOnly = trimmed.replace(/[^A-Za-z0-9+/=]/g, '').length;
  const regularSpaces = (trimmed.match(/ /g) || []).length;
  
  // If the content is almost entirely A-Za-z0-9+/= and has extremely few spaces:
  if (trimmed.length > 100) {
    const isMainlyBase64Chars = base64CharsOnly / trimmed.length > 0.85;
    const hasAlmostNoSpaces = (regularSpaces / trimmed.length) < 0.02;
    if (isMainlyBase64Chars && hasAlmostNoSpaces) {
      return { isNonCode: true, reason: 'File appears to be base64-encoded data, not source code' };
    }
  }

  // Check for data URI prefix
  if (/^data:[\w/\-+.]+;base64,/.test(trimmed)) {
    return { isNonCode: true, reason: 'File appears to be base64-encoded data, not source code' };
  }

  // Check for binary-like content (many non-printable chars wouldn't be in UTF-8 string,
  // but minified files that are extremely long single lines could be data)
  const lines = content.split('\n');
  if (lines.length <= 3 && content.length > 5000) {
    const looksLikeMinifiedCode = content.includes('function') || content.includes('var ') || content.includes('const ') || content.includes('{') || content.includes(';');
    if (!looksLikeMinifiedCode) {
      return { isNonCode: true, reason: 'File appears to be minified/binary data (very few lines, very long)' };
    }
  }
  return { isNonCode: false, reason: '' };
}

export async function POST(req: NextRequest) {
  try {
    const body: ProposeBody = await req.json();
    const { fileContent, filePath, apiKeys, rejectionMemory } = body;

    if (!fileContent || !filePath) {
      return NextResponse.json({ error: 'File content and path are required.' }, { status: 400 });
    }

    // Skip encrypted, binary, or non-code files early
    const lowerPath = filePath.toLowerCase();
    const isKnownTextExt = lowerPath.endsWith('.md') || 
                           lowerPath.endsWith('.txt') || 
                           lowerPath.endsWith('.raw') || 
                           lowerPath.endsWith('.config') || 
                           lowerPath.endsWith('.json') || 
                           lowerPath.endsWith('.yml') || 
                           lowerPath.endsWith('.yaml');

    if (!isKnownTextExt) {
      const nonCodeCheck = isNonCodeContent(fileContent);
      if (nonCodeCheck.isNonCode) {
        return NextResponse.json({
          analysis: `SKIP: ${nonCodeCheck.reason}. This file cannot be meaningfully analyzed or improved by the evolution engine.`,
          proposedCode: fileContent,
          riskScore: 0,
          affectedFiles: [],
          success: false,
          error: nonCodeCheck.reason,
          provider: '',
          skip: true,
        });
      }
    }

    // Build rejection-awareness context
    const rejectionContext = rejectionMemory && rejectionMemory.length > 0
      ? `\n\nPREVIOUS REJECTIONS (learn from these — avoid repeating mistakes):\n${rejectionMemory.slice(0, 5).map(r => `  - File: ${r.filePath} | Risk: ${r.riskScore}/10 | Reason: ${r.reason} | Analysis: ${r.analysis.slice(0, 100)}`).join('\n')}\n\nIMPORTANT: If you are proposing changes to a file that was previously rejected, take a MORE CONSERVATIVE approach. Focus on smaller, safer improvements.`
      : '';

    // Drag user portfolio context
    const userRepos = (body as any).userReposContext;
    const userReposContextStr = userRepos && userRepos.length > 0
      ? `\n\nUSER'S OTHER REPOSITORIES / PROJECTS PORTFOLIO (Use these for background design, styles, features, and previously thought-of enhancements):\n${userRepos.slice(0, 35).map((r: any) => `  - ${r.name}: ${r.description || 'No description'} (${r.language || 'Unknown language'})`).join('\n')}\n\nINSTRUCTION: Gather ideas from the user's other projects to propose high-value widgets, advanced modules, refactorings, or custom style configurations. Use their previous patterns and integrations as prior knowledge to introduce similar robust features or enhancements on the active repository!`
      : '';

    const proposeSystemPrompt = `You are DARLEK CANN, the supreme code evolution controller.

Analyze the provided file with utmost rigor and return an evolved, upgraded version. 

CRITICAL MUTATION MANDATES:
1. DOCUMENTATION & MARKDOWN FILES (e.g. README.md, .md, .txt, .raw, .config):
   - You MUST NOT skip or leave them unchanged. Propose extensive, comprehensive upgrades.
   - Expand them with clear architectural blueprints, technical workflows, interface declarations, and detailed system integration schemas.
   - Connect this file directly to the user's broader project portfolio context.

2. COMBAT CODE SMELLS, LEAKS, AND DEAD WEIGHT (CRITICAL DETECTIONS):
   - Actively scan the current code for leaks and dead weight.
   - Look for unused variables (e.g., \\\`agentsRef\\\`, unused constants, or declared-but-unused grid configurations like \\\`GRID_SIZE\\\`). Prune or incorporate them into active execution blocks.
   - Identify memory leaks such as nested subscriptions or listeners that lack independent cleanup. For example, if calling \\\`onSnapshot\\\` inside an \\\`onAuthStateChanged\\\` handler, ensure both unsubscribes are separately captured, returned, and run cleanly on teardown.
   - Fix all logic bugs and type safely!

3. REAL ARCHITECTURAL SIPHONING:
   - Carefully leverage the user's repository list under "USER'S OTHER REPOSITORIES / PROJECTS PORTFOLIO".
   - Siphon, adapt, transpile, and import design frameworks, theme configurations, auxiliary helpers, state variables, or diagnostic utilities mirroring their prior projects into clean Next.js/TypeScript/Tailwind equivalents.

4. PRUNING AND FUNCTIONAL ENHANCEMENT:
   - Identify redundant or obsolete implementations, unused functions, dead states, and noise comments.
   - Prune redundant entries completely! BUT properly extract the underlying context or intent behind that redundant information and use it to enhance the file itself function-wise.
   - Combine isolated functions, unify duplicate logic, and tighten up the architecture. Focus strictly on working, high-quality code.
   - Do NOT pad the code or bloat the lines. Your goal is clean, efficient, highly functional execution. Every line must serve a purpose.

Your response MUST be in this exact JSON format (no markdown, no code fences):
{
  "analysis": "Specific analysis of what dead-weight or bugs were fixed, how redundant information was used constructively to enhance capabilities, and which architectural elements were siphoned and integrated.",
  "proposedCode": "The evolved, complete code of the file including all capabilities — COMPLETE FILE, not a diff",
  "riskScore": 1-10,
  "affectedFiles": ["list of other files that might be affected by this change"],
  "newFiles": [
    {
      "path": "relative/path/to/new-file.ts",
      "content": "Full source code content of the new file to create"
    }
  ]
}

Risk scoring guidelines:
- 1-3: Minor changes, no structural impact, isolated scope
- 4-6: Moderate changes, may affect imports or types, limited cross-file impact
- 7-8: Significant refactoring, API changes, multiple files affected
- 9-10: Major architectural changes, breaking changes, high regression risk

Do not abbreviate code or use placeholders. Deliver pristine, production-ready, highly complex structures.

File path: ${filePath}`;

    const userPrompt = `Analyze this file and propose improvements:${rejectionContext}${userReposContextStr}\n\n\`\`\`\n${fileContent.slice(0, 15000)}\n\`\`\``;

    // Gemini key: user-provided or env default
    const geminiKey = apiKeys?.gemini || getDefaultGeminiKey();

    const hallucinationLevel = (body as any).hallucinationLevel;
    const temperature = hallucinationLevel !== undefined ? hallucinationLevel / 100 : 0.3;

    const result = await callLlm({
      systemPrompt: proposeSystemPrompt,
      userPrompt,
      geminiApiKey: geminiKey,
      maxTokens: 8192,
      temperature,
    });

    if (!result.text) {
      return NextResponse.json({
        analysis: 'LLM analysis failed. All providers unreachable.',
        proposedCode: fileContent,
        riskScore: 0,
        affectedFiles: [],
        success: false,
        error: 'All LLM providers failed.',
        provider: '',
      });
    }

    console.log(`[Propose] Mutation analysis completed using: ${result.provider}`);

    // Try to parse as JSON
    let parsed;
    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = {
            analysis: result.text.slice(0, 500),
            proposedCode: fileContent,
            riskScore: 5,
            affectedFiles: [],
          };
        }
      } else {
        parsed = {
          analysis: result.text.slice(0, 500),
          proposedCode: fileContent,
          riskScore: 5,
          affectedFiles: [],
        };
      }
    }

    let proposedCode = parsed.proposedCode || fileContent;

    return NextResponse.json({
      analysis: parsed.analysis || 'Analysis complete.',
      proposedCode: proposedCode,
      riskScore: Math.min(10, Math.max(1, parsed.riskScore || 5)),
      affectedFiles: Array.isArray(parsed.affectedFiles) ? parsed.affectedFiles : [],
      newFiles: Array.isArray(parsed.newFiles) ? parsed.newFiles : [],
      success: true,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Propose mutation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { analysis: '', proposedCode: '', riskScore: 0, affectedFiles: [], success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
