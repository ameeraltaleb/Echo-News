/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_ADSENSE_CLIENT_ID: string;
  readonly VITE_GOOGLE_SEARCH_CONSOLE_ID: string;
  readonly VITE_SITE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
