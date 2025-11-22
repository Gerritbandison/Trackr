/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  readonly VITE_ENABLE_LOGGING?: string;
  readonly VITE_USE_COOKIES?: string;
  readonly VITE_USE_MEMORY_STORAGE?: string;
}

declare module '*.jsx' {
  const content: any;
  export default content;
}
