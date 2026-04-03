/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_OLLAMA_MODEL: string
  readonly VITE_LLM_COMPAT_URL: string
  readonly VITE_LLM_COMPAT_KEY: string
  readonly VITE_LLM_COMPAT_MODEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
