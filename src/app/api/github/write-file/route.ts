import { NextRequest, NextResponse } from 'next/server';
import type { WriteFileBody } from '@/lib/types';

// Helper to fetch the actual file SHA from GitHub if not provided or to ensure it is accurate
async function getFileSha(token: string, owner: string, repo: string, branch: string, filePath: string): Promise<string | null> {
  try {
    const cleanPath = filePath.replace(/^\/+|\/+$/g, '');
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.sha || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: WriteFileBody = await req.json();
    const { token, owner, repo, branch, path: filePath, content, sha, commitMessage } = body;

    if (!token || !owner || !repo || !branch || !filePath || !content) {
      return NextResponse.json(
        { error: 'All fields are required: token, owner, repo, branch, path, content.' },
        { status: 400 }
      );
    }

    // Resolve accurate SHA from GitHub if missing or falsy
    let finalSha = sha || null;
    if (!finalSha) {
      const fetchedSha = await getFileSha(token, owner, repo, branch, filePath);
      if (fetchedSha) {
        finalSha = fetchedSha;
      }
    }

    const cleanPath = filePath.replace(/^\/+|\/+$/g, '');
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;

    const bodyPayload: Record<string, unknown> = {
      message: commitMessage || `[DARLEK CANN] Mutate ${filePath}`,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
    };

    if (finalSha) {
      bodyPayload.sha = finalSha;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      commitSha: data.commit?.sha,
      contentSha: data.content?.sha,
      commitUrl: data.commit?.html_url,
    });
  } catch (error) {
    console.error('Write file error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

