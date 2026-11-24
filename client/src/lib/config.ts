// Application configuration for cross-platform compatibility
export const APP_CONFIG = {
  api: {
    version: 'v1',
    baseUrl: import.meta.env.VITE_API_URL || '',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  },
  features: {
    cors: true,
    multiFormat: true,
    nlpAnalysis: true,
    exportAnalysis: true,
    apiDocumentation: true,
  },
  ui: {
    theme: 'light',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    syntaxHighlighting: true,
    codeEditorTheme: 'github',
  },
  export: {
    formats: ['json', 'csv', 'xml'],
    includeMetadata: true,
    includeAnalysis: true,
  },
};

// API endpoint builder
export function buildApiUrl(endpoint: string): string {
  const { baseUrl, version } = APP_CONFIG.api;
  const path = endpoint.replace(/^\/+/, '');
  if (path.startsWith('api/')) return `${baseUrl}/${path}`;
  if (path.startsWith(`${version}/`) || path === 'health') return `${baseUrl}/api/${path}`;
  return `${baseUrl}/api/${version}/${path}`;
}

// Feature flags
export function isFeatureEnabled(feature: keyof typeof APP_CONFIG.features): boolean {
  return APP_CONFIG.features[feature] === true;
}

let sessionToken: string | undefined;

export function setApiToken(token?: string): void {
  sessionToken = token;
}

export function getApiHeaders(json = true): Record<string, string> {
  return {
    ...(json ? APP_CONFIG.api.headers : {}),
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
  };
}
