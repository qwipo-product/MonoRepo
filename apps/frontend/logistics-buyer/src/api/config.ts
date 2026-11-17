// Mirrors the original ConfigService: config.json is loaded once before the app boots (APP_INITIALIZER).
export interface AppConfig {
  env: string;
  buyerUrl: string;
  authUrl: string;
  googleMapsKey: string;
  fileServicesUrl: string;
  sse: string;
}

let config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  const res = await fetch(new URL('assets/configs/config.json', document.baseURI));
  config = (await res.json()) as AppConfig;
  return config;
}

export function getConfig(): AppConfig {
  if (!config) throw new Error('Config not loaded');
  return config;
}
