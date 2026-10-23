import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from "axios";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
  }
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1`;
};

export const getWsBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:8080`;
  }
  return "ws://localhost:8080";
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>("/auth/refresh")
      .then((response) => {
        const token = response.data.access_token;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        clearAccessToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/** Restore a session from the HttpOnly refresh cookie after a reload. */
export async function bootstrapSession(): Promise<boolean> {
  if (accessToken) return true;
  return (await refreshAccessToken()) !== null;
}

/** Public login/signup helpers call this after receiving an access token. */
export function rememberAccessToken(token: string) {
  setAccessToken(token);
}

export async function logoutSession() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export const getWsTicket = () =>
  post<{ ticket: string; expires_in: number }>("/ws/ticket");

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthCall =
      original?.url?.includes("/auth/refresh") ||
      original?.url?.includes("/auth/login") ||
      original?.url?.includes("/auth/register");

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const token = await refreshAccessToken();

      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api.request(original);
      }

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export interface RequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  responseType?:
    | "json"
    | "text"
    | "blob"
    | "arraybuffer"
    | "document"
    | "stream";
}

export async function request<T = unknown>(
  method: Method,
  url: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const response: AxiosResponse<T> = await api.request({
    method,
    url,
    data,
    ...config,
  });
  return response.data;
}

export const get = <T = unknown>(url: string, config?: RequestConfig) =>
  request<T>("GET", url, undefined, config);

export const post = <T = unknown>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
) => request<T>("POST", url, data, config);

export const put = <T = unknown>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
) => request<T>("PUT", url, data, config);

export const patch = <T = unknown>(
  url: string,
  data?: unknown,
  config?: RequestConfig,
) => request<T>("PATCH", url, data, config);

export const del = <T = unknown>(url: string, config?: RequestConfig) =>
  request<T>("DELETE", url, undefined, config);
