export type FeedbackContext = {
  mode: 'year' | 'custom';
  targetDays: number;
  progressEnabled: boolean;
  taskCount: number;
  appVersion: string;
  platform: string;
};

export type FeedbackSubmission = {
  message: string;
  contact?: string;
  context: FeedbackContext;
};

type FeedbackPayload = {
  message: string;
  contact?: string;
  context: FeedbackContext;
  createdAt: string;
};

const FEEDBACK_WEBHOOK_URL = process.env.EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL?.trim() ?? '';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPayload(submission: FeedbackSubmission): FeedbackPayload {
  return {
    message: submission.message.trim(),
    contact: submission.contact?.trim() || undefined,
    context: submission.context,
    createdAt: new Date().toISOString(),
  };
}

async function fetchWithTimeout(url: string, payload: FeedbackPayload): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableStatus(status: number): boolean {
  return status >= 500;
}

export function isFeedbackConfigured(): boolean {
  return FEEDBACK_WEBHOOK_URL.length > 0;
}

export async function submitFeedback(submission: FeedbackSubmission): Promise<void> {
  if (!isFeedbackConfigured()) {
    throw new Error('Feedback channel is not configured.');
  }

  const payload = buildPayload(submission);
  if (!payload.message) {
    throw new Error('Feedback message is required.');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(FEEDBACK_WEBHOOK_URL, payload);

      if (response.ok) {
        return;
      }

      if (!isRetryableStatus(response.status)) {
        throw new Error(`Feedback request failed (${response.status}).`);
      }

      lastError = new Error(`Feedback request failed (${response.status}).`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error('Feedback request timed out.');
      } else if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error('Unknown feedback submission error.');
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      await delay(650);
    }
  }

  throw lastError ?? new Error('Failed to submit feedback.');
}
