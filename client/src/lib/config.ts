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
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Handle endpoints that already include version
  if (cleanEndpoint.includes('/v1/') || cleanEndpoint === 'health') {
    return `${baseUrl}/api/${cleanEndpoint}`;
  }

  return `${baseUrl}/api/${version}/${cleanEndpoint}`;
}

// Feature flags
export function isFeatureEnabled(feature: keyof typeof APP_CONFIG.features): boolean {
  return APP_CONFIG.features[feature] === true;
}

// Cross-platform headers
export function getApiHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  return {
    ...APP_CONFIG.api.headers,
    ...additionalHeaders,
  };
}
