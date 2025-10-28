import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl, getApiHeaders, APP_CONFIG } from "./config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      if (errorData.error) {
        throw new Error(errorData.error);
      }
    } catch {
      // Fallback to text if JSON parsing fails
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = buildApiUrl(endpoint);
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: isFormData ? {} : getApiHeaders(),
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
    signal: AbortSignal.timeout(APP_CONFIG.api.timeout),
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build the API URL with versioning
    const endpoint = Array.isArray(queryKey) ? String(queryKey[0]) : String(queryKey);
    const url = buildApiUrl(endpoint);
    
    const res = await fetch(url, {
      headers: getApiHeaders(),
      credentials: "include",
      signal: AbortSignal.timeout(APP_CONFIG.api.timeout),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    // Handle v1 API response format
    if (data.success === false) {
      throw new Error(data.error || 'Request failed');
    }
    
    // Return data directly if it's wrapped in success/data format
    return data.data !== undefined ? data.data : data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
