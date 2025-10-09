import { NextRequest, NextResponse } from 'next/server';

const CLIENT_HEADER_VALUE = 'teachezee-next';

export class LLMBackendError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'LLMBackendError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Get the LLM backend base URL
 * Hardcoded to ap.thesmartlanguage.com for reliability
 */
function getBackendBaseUrl(): string {
  const baseUrl = 'https://ap.thesmartlanguage.com';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function buildHeaders(source?: HeadersInit): Headers {
  const headers = new Headers(source);

  // Set client identifier for backend logging
  headers.set('x-llm-client', CLIENT_HEADER_VALUE);

  return headers;
}

export async function proxyLLMRequest(
  request: NextRequest,
  targetPath: string,
  init?: { method?: string; headers?: HeadersInit }
): Promise<NextResponse> {
  const baseUrl = getBackendBaseUrl();
  const backendUrl = new URL(targetPath, baseUrl);

  const method = init?.method ?? request.method ?? 'GET';
  const headers = buildHeaders(init?.headers);

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === 'host' || normalizedKey === 'content-length') {
      return;
    }
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  const fetchInit: RequestInit = {
    method,
    headers,
    redirect: 'manual',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    fetchInit.body = request.body;
    (fetchInit as any).duplex = 'half';
  }

  const response = await fetch(backendUrl, fetchInit);

  const responseHeaders = new Headers(response.headers);
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

interface JsonRequestOptions {
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: HeadersInit;
  signal?: AbortSignal;
}

/**
 * Send JSON request to LLM backend at ap.thesmartlanguage.com
 */
export async function sendLLMJson<T>(
  targetPath: string,
  payload: unknown,
  options?: JsonRequestOptions
): Promise<T> {
  const baseUrl = getBackendBaseUrl();
  const backendUrl = new URL(targetPath, baseUrl);
  const method = options?.method ?? 'POST';
  const headers = buildHeaders(options?.headers);

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  const response = await fetch(backendUrl, {
    method,
    headers,
    body: JSON.stringify(payload ?? {}),
    signal: options?.signal,
  });

  let responseBody: string | null = null;
  try {
    responseBody = await response.text();
  } catch (error) {
    if (response.ok) {
      throw error;
    }
  }

  const parsed = responseBody ? safeJsonParse(responseBody) : undefined;

  if (!response.ok) {
    console.error('[LLM Backend] Request failed', {
      path: targetPath,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      rawBody: responseBody,
    });
    const message = (parsed as any)?.error || response.statusText || 'LLM backend request failed';
    throw new LLMBackendError(message, response.status, parsed ?? responseBody);
  }

  return parsed as T;
}

function safeJsonParse(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}
