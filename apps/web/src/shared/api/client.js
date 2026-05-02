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

/**
 * GET a binary response (PDF, etc.) with the stored Bearer token. Plain
 * <a href="/api/..."> navigations do not send Authorization, so use this
 * for "View file" on protected document routes.
 *
 * @param {string} path e.g. `/api/v1/resumes/files/{uploadId}`
 * @returns {Promise<{ blob: Blob, contentType: string }>}
 */
export async function fetchAuthBlob(path) {
  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    headers: {
      ...(getStoredAuthToken() ? { Authorization: `Bearer ${getStoredAuthToken()}` } : {}),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json().catch(() => null);
      if (payload?.success === false && payload.error) {
        throw new ApiClientError(
          payload.error.message,
          response.status,
          payload.error.code,
          payload.error.details,
        );
      }
      throw new ApiClientError(payload?.message || "Request failed", response.status);
    }
    throw new ApiClientError(`Request failed: ${response.status}`, response.status);
  }

  const blob = await response.blob();
  return {
    blob,
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}

/**
 * Open a protected file in a new tab (uses Blob URL after authed fetch).
 * Uses an iframe inside `about:blank` so the tab's address bar is not a raw
 * `blob:` URL (pasting that into the omnibox often triggers a web search
 * instead of opening the file).
 * @param {string} filePath From API: `/resumes/files/...` or full `http...`
 */
export async function openProtectedApiFile(filePath) {
  if (!filePath) {
    return;
  }
  if (filePath.startsWith("http")) {
    window.open(filePath, "_blank", "noopener,noreferrer");
    return;
  }
  const path = filePath.startsWith("/api/")
    ? filePath
    : `/api/v1${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
  const { blob, contentType } = await fetchAuthBlob(path);
  const buf = await blob.arrayBuffer();
  const isPdf = /pdf/i.test(String(contentType || "")) || /pdf/i.test(String(blob.type || ""));
  const displayBlob = new Blob([buf], { type: isPdf ? "application/pdf" : blob.type || "application/octet-stream" });
  const objectUrl = URL.createObjectURL(displayBlob);

  const w = window.open("about:blank", "_blank", "noopener,noreferrer");
  if (!w) {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = isPdf ? "resume.pdf" : "download";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    return;
  }

  try {
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Resume</title><style>html,body{margin:0;height:100%;}iframe{border:0;width:100%;height:100%;}</style></head><body></body></html>",
    );
    w.document.close();
    const iframe = w.document.createElement("iframe");
    iframe.setAttribute("src", objectUrl);
    iframe.setAttribute("title", "Resume preview");
    iframe.setAttribute("style", "width:100%;height:100vh;border:0");
    w.document.body.appendChild(iframe);
  } catch {
    w.close();
    const fallback = window.open(objectUrl, "_blank", "noopener,noreferrer");
    if (!fallback) {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = isPdf ? "resume.pdf" : "download";
      a.rel = "noopener noreferrer";
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    return;
  }

  const done = () => {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {
      /* ignore */
    }
  };
  const poll = setInterval(() => {
    if (w.closed) {
      clearInterval(poll);
      done();
    }
  }, 1000);
  setTimeout(() => {
    clearInterval(poll);
    done();
  }, 30 * 60 * 1000);
}
