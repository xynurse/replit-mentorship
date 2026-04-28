import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    // Build URL from query key: first element is the path, any object elements become query params
    const [path, ...rest] = queryKey;
    let url = path as string;
    const params: Record<string, string> = {};
    for (const segment of rest) {
      if (segment && typeof segment === "object" && !Array.isArray(segment)) {
        for (const [k, v] of Object.entries(segment as Record<string, unknown>)) {
          if (v !== undefined && v !== null) {
            params[k] = String(v);
          }
        }
      } else if (segment !== undefined && segment !== null) {
        url = url.endsWith("/") ? url + segment : url + "/" + segment;
      }
    }
    const qs = new URLSearchParams(params).toString();
    if (qs) url = url + "?" + qs;

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
