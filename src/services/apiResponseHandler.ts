// src/services/apiResponseHandler.ts
// Robust, production-grade AI API response parser, error sanitizer, and retry client

export interface SafeFetchRetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (info: {
    attempt: number;
    maxRetries: number;
    delayMs: number;
    reason: string;
    status?: number;
  }) => void;
}

export interface StructuredAIError extends Error {
  code?: string;
  status?: number;
  is503?: boolean;
  isRateLimit?: boolean;
  isDailyQuota?: boolean;
  isRpmLimit?: boolean;
  retryDelaySeconds?: number | null;
  suggestedAction?: string;
  isAuthError?: boolean;
  isBillingRequired?: boolean;
  isTimeout?: boolean;
  isHtmlResponse?: boolean;
  rawResponseSnippet?: string;
  retryAttempts?: number;
}

/**
 * Parses raw text that might be stringified JSON from an AI provider
 */
function tryExtractErrorMessage(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'Unknown server response.';
  const trimmed = raw.trim();

  // If it starts with JSON-like structure
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.error) {
        if (typeof parsed.error === 'string') return parsed.error;
        if (typeof parsed.error === 'object') {
          if (parsed.error.message) return parsed.error.message;
          if (parsed.error.code) return `Error code: ${parsed.error.code}`;
        }
      }
      if (parsed.message && typeof parsed.message === 'string') {
        return parsed.message;
      }
    } catch {
      // not valid JSON, proceed
    }
  }

  return trimmed;
}

/**
 * Checks if an error is transient and eligible for retry.
 * 429 Quota errors are deliberately NOT retried in tight loops.
 */
export function isRetryableError(status: number, message: string, code?: string): boolean {
  // 503: Service Unavailable / High demand
  if (status === 503) return true;
  // 502 / 504: Bad Gateway / Gateway Timeout
  if (status === 502 || status === 504) return true;
  // 429 Quota/Rate Limit: Do NOT repeatedly pound the API in a rapid retry loop
  if (status === 429) return false;

  const lower = (message + ' ' + (code || '')).toLowerCase();
  if (lower.includes('high demand') || lower.includes('unavailable') || lower.includes('overloaded')) {
    return true;
  }
  if (lower.includes('timeout') || lower.includes('econnreset') || lower.includes('socket hang up')) {
    return true;
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return true;
  }

  return false;
}

/**
 * Safely executes a fetch request with:
 * 1. Safe body inspection (never blindly calling res.json() on HTML).
 * 2. HTML response detection with helpful diagnostics.
 * 3. Exponential backoff + randomized jitter retry for 503 and transient errors.
 * 4. Error mapping with clean human-readable messaging and quota classification.
 */
export async function safeFetchAIJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryConfig: SafeFetchRetryConfig = {}
): Promise<T> {
  const maxRetries = retryConfig.maxRetries ?? 3;
  const initialDelay = retryConfig.initialDelayMs ?? 1200;
  const maxDelay = retryConfig.maxDelayMs ?? 8000;
  const backoffFactor = retryConfig.backoffFactor ?? 1.8;

  let lastError: StructuredAIError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(input, init);

      const contentType = res.headers.get('content-type') || '';
      const rawText = await res.text();
      const isHtml =
        contentType.includes('text/html') ||
        rawText.trim().startsWith('<!DOCTYPE') ||
        rawText.trim().startsWith('<!doctype') ||
        rawText.trim().startsWith('<html');

      // Handle HTML responses safely (prevent SyntaxError: Unexpected token '<')
      if (isHtml) {
        const titleMatch = rawText.match(/<title>([^<]+)<\/title>/i);
        const titleText = titleMatch ? titleMatch[1].trim() : '';

        const err: StructuredAIError = new Error(
          titleText
            ? `Server returned an HTML page (${res.status} ${res.statusText}): "${titleText}". The backend service or proxy may be restarting.`
            : `Server returned an HTML response (${res.status} ${res.statusText}) instead of JSON. The backend service may be temporarily unavailable.`
        );
        err.status = res.status;
        err.code = 'HTML_RESPONSE_RECEIVED';
        err.isHtmlResponse = true;
        err.rawResponseSnippet = rawText.slice(0, 300);

        if (isRetryableError(res.status, err.message, err.code) && attempt < maxRetries) {
          lastError = err;
          const delayMs = Math.min(initialDelay * Math.pow(backoffFactor, attempt) + Math.random() * 400, maxDelay);
          if (retryConfig.onRetry) {
            retryConfig.onRetry({
              attempt: attempt + 1,
              maxRetries,
              delayMs: Math.round(delayMs),
              reason: 'Server route returned HTML error page',
              status: res.status,
            });
          }
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        throw err;
      }

      // Parse JSON safely
      let parsedJson: any = null;
      if (rawText.trim().length > 0) {
        try {
          parsedJson = JSON.parse(rawText);
        } catch {
          const err: StructuredAIError = new Error(
            `Invalid JSON response from server (${res.status} ${res.statusText}): ${rawText.slice(0, 150)}`
          );
          err.status = res.status;
          err.code = 'INVALID_JSON_RESPONSE';
          throw err;
        }
      }

      // Check HTTP status code
      if (!res.ok) {
        const extractedMessage = tryExtractErrorMessage(
          parsedJson?.error || parsedJson?.message || rawText || res.statusText
        );

        const err: StructuredAIError = new Error(extractedMessage);
        err.status = res.status;
        err.code = parsedJson?.code || `HTTP_${res.status}`;
        err.is503 =
          res.status === 503 ||
          extractedMessage.toLowerCase().includes('503') ||
          extractedMessage.toLowerCase().includes('high demand') ||
          extractedMessage.toLowerCase().includes('unavailable');
        err.isRateLimit = res.status === 429 || extractedMessage.toLowerCase().includes('quota') || Boolean(parsedJson?.isRateLimit);
        err.isDailyQuota = Boolean(parsedJson?.isDailyQuota);
        err.isRpmLimit = Boolean(parsedJson?.isRpmLimit);
        err.retryDelaySeconds = parsedJson?.retryDelaySeconds ?? null;
        err.suggestedAction = parsedJson?.suggestedAction;
        err.isBillingRequired = Boolean(parsedJson?.isBillingRequired);
        err.isAuthError =
          res.status === 401 ||
          res.status === 403 ||
          parsedJson?.code === 'API_KEY_NOT_CONFIGURED' ||
          parsedJson?.code === 'AI_SETUP_REQUIRED' ||
          parsedJson?.code === 'API_KEY_INVALID';
        err.isTimeout = res.status === 504 || extractedMessage.toLowerCase().includes('timeout');

        // Check if retryable (transient errors only; 429 quota exhaustion is NOT blindly retried)
        if (isRetryableError(res.status, extractedMessage, err.code) && attempt < maxRetries) {
          lastError = err;
          const delayMs = Math.min(initialDelay * Math.pow(backoffFactor, attempt) + Math.random() * 400, maxDelay);
          const reason = err.is503
            ? 'Model is experiencing high demand (503)'
            : `Server returned status ${res.status}`;

          if (retryConfig.onRetry) {
            retryConfig.onRetry({
              attempt: attempt + 1,
              maxRetries,
              delayMs: Math.round(delayMs),
              reason,
              status: res.status,
            });
          }
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        throw err;
      }

      // Success
      return (parsedJson !== null ? parsedJson : {}) as T;
    } catch (networkError: any) {
      // If it's already a StructuredAIError thrown intentionally by the !res.ok branch
      if (networkError.code && networkError.status !== undefined) {
        lastError = networkError;
        // If it wasn't retried above, it will bubble out below
        throw networkError;
      }

      // Genuine network fetch error (e.g. Failed to fetch, connection refused)
      const err: StructuredAIError = new Error(networkError?.message || 'Network connection failed.');
      err.code = 'NETWORK_ERROR';
      lastError = err;

      if (attempt < maxRetries) {
        const delayMs = Math.min(initialDelay * Math.pow(backoffFactor, attempt) + Math.random() * 400, maxDelay);
        if (retryConfig.onRetry) {
          retryConfig.onRetry({
            attempt: attempt + 1,
            maxRetries,
            delayMs: Math.round(delayMs),
            reason: 'Network connection glitch',
          });
        }
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('Request failed after maximum retry attempts.');
}

/**
 * Translates any error into a clear, user-friendly diagnostic message
 */
export function formatAIErrorMessage(error: any): {
  title: string;
  message: string;
  isRetryable: boolean;
  isAuth: boolean;
  code?: string;
} {
  const rawMsg = error?.message || 'An unexpected error occurred.';
  const code = error?.code || '';
  const status = error?.status;

  if (
    error?.is503 ||
    status === 503 ||
    rawMsg.includes('503') ||
    rawMsg.toLowerCase().includes('high demand') ||
    rawMsg.toLowerCase().includes('unavailable')
  ) {
    return {
      title: 'Gemini Model High Demand (503)',
      message:
        'The Gemini model is currently experiencing a temporary spike in traffic. We automatically retried, but it was still busy. Please click "Retry Now" in a few seconds.',
      isRetryable: true,
      isAuth: false,
      code: 'MODEL_HIGH_DEMAND_503',
    };
  }

  if (error?.isHtmlResponse || code === 'HTML_RESPONSE_RECEIVED') {
    return {
      title: 'Backend Route Unreachable',
      message:
        'The server returned an HTML error page instead of JSON. The backend process or development server may be restarting. Please retry in a few moments.',
      isRetryable: true,
      isAuth: false,
      code: 'HTML_RESPONSE_RECEIVED',
    };
  }

  if (
    code === 'API_KEY_NOT_CONFIGURED' ||
    rawMsg.includes('API key is not configured') ||
    rawMsg.includes('API_KEY_NOT_CONFIGURED')
  ) {
    return {
      title: 'Gemini API Key Required',
      message:
        'No Gemini API key is currently configured for your account. Please configure your key in the Gemini API Configuration section.',
      isRetryable: false,
      isAuth: true,
      code: 'API_KEY_NOT_CONFIGURED',
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    rawMsg.includes('API_KEY_INVALID') ||
    rawMsg.includes('PERMISSION_DENIED') ||
    rawMsg.toLowerCase().includes('invalid gemini api key')
  ) {
    return {
      title: 'Invalid or Unauthorized API Key',
      message:
        'Your configured Gemini API key was rejected by Google servers. Please verify or update your key in the Gemini API Configuration section.',
      isRetryable: false,
      isAuth: true,
      code: 'API_KEY_INVALID',
    };
  }

  if (status === 429 || rawMsg.includes('429') || rawMsg.toLowerCase().includes('quota')) {
    return {
      title: 'API Quota Exceeded (429)',
      message:
        'Your Gemini API key has exceeded its current rate limit or quota allowance. Please verify your billing or quota tier in Google AI Studio or Google Cloud Console.',
      isRetryable: true,
      isAuth: false,
      code: 'QUOTA_EXCEEDED',
    };
  }

  if (status === 504 || rawMsg.toLowerCase().includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message:
        'Generating the script took longer than the 30-second server limit. Try with a slightly shorter source text or click Retry Now.',
      isRetryable: true,
      isAuth: false,
      code: 'TIMEOUT',
    };
  }

  return {
    title: 'Generation Error',
    message: rawMsg,
    isRetryable: true,
    isAuth: false,
    code: code || 'UNKNOWN_ERROR',
  };
}
