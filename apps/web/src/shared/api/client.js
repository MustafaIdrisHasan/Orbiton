export const AUTH_TOKEN_STORAGE_KEY = "orbiton-auth-token";

export class ApiClientError extends Error {
  constructor(message, status = 500, code = "API_ERROR", details = null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function buildApiUrl(path) {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  return `${baseUrl}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

export async function apiRequest(path, { method = "GET", body, headers = {}, token } = {}) {
  const resolvedToken = token || getStoredAuthToken();
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (payload?.success === false && payload.error) {
      throw new ApiClientError(payload.error.message, response.status, payload.error.code, payload.error.details);
    }

    throw new ApiClientError(payload?.message || "Request failed", response.status);
  }

  if (payload?.success === false && payload.error) {
    throw new ApiClientError(payload.error.message, response.status, payload.error.code, payload.error.details);
  }

  return payload?.success ? payload.data : payload;
}
