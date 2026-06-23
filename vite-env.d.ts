/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DISABLE_HMR: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}