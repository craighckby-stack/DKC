export const SystemDiagnostics = {
  log: (msg: string, level: 'INFO' | 'WARN' | 'CRIT' = 'INFO') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${msg}`);
  },
  reportQuota: () => {
    console.warn('⚠️ [DIAGNOSTIC]: API Quota Exhausted. Switching to local heuristic memory.');
  }
};