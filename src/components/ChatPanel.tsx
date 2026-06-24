'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, GitBranch, RefreshCw, Paperclip, File, X } from 'lucide-react';
import type { Message, SystemState, BranchInfo } from '@/lib/types';
import { SETUP_STEPS, COLORS } from '@/lib/constants';
import ChatMessage from './ChatMessage';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string, fileAttachment?: { name: string; content: string }) => void;
  isLoading: boolean;
  systemState: SystemState;
  onTestConnection: (provider: string, key: string) => void;
  onUpdateKey: (key: string, value: string) => void;
  onUpdateRepoConfig: (field: 'owner' | 'repo' | 'branch', value: string) => void;
  branches: BranchInfo[];
  branchesLoading: boolean;
  onFetchBranches: () => void;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  systemState,
  onTestConnection,
  onUpdateKey,
  onUpdateRepoConfig,
  branches,
  branchesLoading,
  onFetchBranches,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content: content || '',
      });
    };
    reader.readAsText(file);
  };

  const handleSend = useCallback(() => {
    if ((input.trim() || attachedFile) && !isLoading) {
      onSendMessage(input.trim(), attachedFile || undefined);
      setInput('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [input, attachedFile, isLoading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentStep = systemState.currentStep;
  const setupStep = currentStep < SETUP_STEPS.length ? SETUP_STEPS[currentStep] : null;

  const getStatusText = (status: string): string => {
    if (status === 'testing') return 'TESTING...';
    if (status === 'connected') return 'ONLINE';
    if (status === 'error') return 'FAILED';
    return 'IDLE';
  };

  const handleBranchSelect = (branchName: string) => {
    onUpdateRepoConfig('branch', branchName);
    onSendMessage(`branch: ${branchName}`);
  };

  const renderSetupInput = () => {
    if (!setupStep || systemState.setupComplete) return null;

    const stepId = setupStep.id;

    if (stepId === 'repo') {
      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <input
            type="text"
            placeholder={setupStep.placeholder}
            defaultValue="craighckby-stack/Test-1-"
            className="dalek-input w-full px-4 py-3 text-sm"
            onChange={(e) => {
              const val = e.target.value;
              const parts = val.split('/');
              onUpdateRepoConfig('owner', parts[0] || '');
              onUpdateRepoConfig('repo', parts.slice(1).join('/') || '');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && systemState.repoConfig.owner && systemState.repoConfig.repo) {
                onSendMessage(`repo: ${systemState.repoConfig.owner}/${systemState.repoConfig.repo}`);
              }
            }}
          />
          <button
            onClick={() => {
              if (systemState.repoConfig.owner && systemState.repoConfig.repo) {
                onSendMessage(`repo: ${systemState.repoConfig.owner}/${systemState.repoConfig.repo}`);
              }
            }}
            disabled={!systemState.repoConfig.owner || !systemState.repoConfig.repo}
            className="dalek-btn dalek-btn-primary px-6 py-2 text-xs w-full"
          >
            SET TARGET REPOSITORY
          </button>
        </div>
      );
    }

    if (stepId === 'branch') {
      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={14} style={{ color: COLORS.gold }} />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: COLORS.gold,
                }}
              >
                SELECT BRANCH
              </span>
            </div>
            <button
              onClick={onFetchBranches}
              disabled={branchesLoading}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all"
              style={{
                color: COLORS.cyan,
                background: 'rgba(0, 255, 204, 0.05)',
                border: '1px solid rgba(0, 255, 204, 0.15)',
                cursor: branchesLoading ? 'not-allowed' : 'pointer',
                opacity: branchesLoading ? 0.5 : 1,
              }}
              title="Refresh branch list"
            >
              <RefreshCw size={11} className={branchesLoading ? 'animate-spin' : ''} />
              REFRESH
            </button>
          </div>

          {branchesLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin" style={{ color: COLORS.dalekRed }} />
              <span style={{ color: COLORS.textMuted, fontSize: '11px', fontFamily: 'var(--font-share-tech-mono), monospace' }}>
                Scanning branches...
              </span>
            </div>
          ) : branches.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto dalek-scrollbar pr-1">
              {branches.map((branch) => (
                <button
                  key={branch.name}
                  onClick={() => handleBranchSelect(branch.name)}
                  className="w-full text-left px-3 py-2.5 rounded flex items-center justify-between group transition-all"
                  style={{
                    background: systemState.repoConfig.branch === branch.name
                      ? 'rgba(185, 28, 28, 0.15)'
                      : 'rgba(20, 10, 10, 0.6)',
                    border: `1px solid ${systemState.repoConfig.branch === branch.name ? 'rgba(185, 28, 28, 0.4)' : 'rgba(185, 28, 28, 0.1)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch
                      size={12}
                      style={{
                        color: branch.default ? COLORS.gold : systemState.repoConfig.branch === branch.name ? COLORS.dalekRed : COLORS.textMuted,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-share-tech-mono), monospace',
                        fontSize: '12px',
                        color: '#ffffff',
                      }}
                    >
                      {branch.name}
                    </span>
                  </div>
                  {branch.default && (
                    <span
                      style={{
                        fontFamily: 'var(--font-orbitron), sans-serif',
                        fontSize: '8px',
                        letterSpacing: '0.08em',
                        color: COLORS.gold,
                        background: 'rgba(212, 160, 23, 0.1)',
                        border: '1px solid rgba(212, 160, 23, 0.2)',
                        padding: '1px 6px',
                        borderRadius: '2px',
                      }}
                    >
                      DEFAULT
                    </span>
                  )}
                  {systemState.repoConfig.branch === branch.name && !branch.default && (
                    <span
                      style={{
                        fontFamily: 'var(--font-orbitron), sans-serif',
                        fontSize: '8px',
                        letterSpacing: '0.08em',
                        color: COLORS.dalekRed,
                        background: 'rgba(185, 28, 28, 0.1)',
                        border: '1px solid rgba(185, 28, 28, 0.2)',
                        padding: '1px 6px',
                        borderRadius: '2px',
                      }}
                    >
                      SELECTED
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <span style={{ color: COLORS.textMuted, fontSize: '11px', fontFamily: 'var(--font-share-tech-mono), monospace' }}>
                No branches found. Check repository access.
              </span>
            </div>
          )}

          <div
            className="pt-2"
            style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}
          >
            <span style={{ color: COLORS.textMuted, fontSize: '9px', fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}>
              OR ENTER CUSTOM BRANCH:
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="text"
                placeholder="branch name..."
                defaultValue="enhanced-by-brain"
                className="dalek-input flex-1 px-3 py-2 text-xs"
                onChange={(e) => onUpdateRepoConfig('branch', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSendMessage(`branch: ${e.target.value || 'enhanced-by-brain'}`);
                  }
                }}
              />
              <button
                onClick={() => onSendMessage(`branch: ${systemState.repoConfig.branch || 'enhanced-by-brain'}`)}
                className="dalek-btn dalek-btn-primary px-3 py-2 text-xs"
              >
                SET
              </button>
            </div>
          </div>
        </div>
      );
    }

    // GitHub token step
    if (stepId === 'github') {
      const currentValue = systemState.apiKeys.github;
      const status = systemState.connectionStatus.github;

      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div
            className="px-3 py-2 rounded text-xs mb-2"
            style={{
              color: COLORS.cyan,
              background: 'rgba(0, 255, 204, 0.03)',
              border: '1px solid rgba(0, 255, 204, 0.1)',
            }}
          >
            Dalek Brain Engine: ONLINE (built-in) | No external APIs
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={setupStep.placeholder}
              className="dalek-input flex-1 px-4 py-3 text-sm"
              value={currentValue}
              onChange={(e) => onUpdateKey('github', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentValue.trim()) {
                  onTestConnection('github', currentValue);
                }
              }}
            />
            <button
              onClick={() => onTestConnection('github', currentValue)}
              disabled={!currentValue.trim() || status === 'testing'}
              className="dalek-btn dalek-btn-primary px-4 py-3 text-xs whitespace-nowrap"
            >
              {status === 'testing' ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  TESTING
                </span>
              ) : (
                <span>CONNECT</span>
              )}
            </button>
          </div>
          {status !== 'idle' && (
            <div
              className="px-3 py-2 rounded text-xs"
              style={{
                color: status === 'connected' ? COLORS.cyan : COLORS.dalekRed,
                background: status === 'connected' ? 'rgba(0, 255, 204, 0.05)' : 'rgba(255, 32, 32, 0.05)',
                border: `1px solid ${status === 'connected' ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 32, 32, 0.1)'}`,
              }}
            >
              {getStatusText(status)} — GitHub {status === 'connected' ? 'connected.' : 'connection failed. Try again.'}
            </div>
          )}
          {status === 'connected' && (
            <button
              onClick={() => onSendMessage('github: configured')}
              className="dalek-btn dalek-btn-secondary px-4 py-2 text-xs w-full"
            >
              CONTINUE
            </button>
          )}
        </div>
      );
    }

    // Gemini API key step
    if (stepId === 'llm-keys') {
      const geminiStatus = systemState.connectionStatus.gemini;
      const geminiKey = systemState.apiKeys.gemini || '';
      const isGeoblocked = (systemState as unknown as Record<string, unknown>).geminiGeoblocked === true;

      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div
            className="px-3 py-2 rounded text-xs mb-2"
            style={{
              color: geminiStatus === 'connected' ? COLORS.green : COLORS.gold,
              background: geminiStatus === 'connected' ? 'rgba(0, 255, 136, 0.05)' : 'rgba(212, 160, 23, 0.05)',
              border: `1px solid ${geminiStatus === 'connected' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(212, 160, 23, 0.1)'}`,
            }}
          >
            {geminiStatus === 'connected'
              ? 'Gemini connected — external LLM augmentation active.'
              : isGeoblocked
                ? 'Gemini geoblocked. Dalek Brain active.'
                : geminiKey
                  ? 'Gemini key detected. Test to verify connection.'
                  : 'Dalek Brain engine is ACTIVE. Gemini is optional external augmentation.'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: '#4285f4',
                }}
       
