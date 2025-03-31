/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADAPTER_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
