/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORT: string;
  readonly DISABLE_HMR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __BUILD_TIMESTAMP__: string;
declare const __AGENT_CORE_VERSION__: string;
declare const __ENV_MODE__: string;