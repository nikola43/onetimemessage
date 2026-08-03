const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface CreateSecretRequest {
  content: string;
  passphrase?: string;
  ttl_seconds?: number;
  max_views?: number;
  burn_after_reading?: boolean;
}

export interface CreateSecretResponse {
  id: string;
  expires_at: string;
  share_url: string;
}

export interface SecretMetadata {
  exists: boolean;
  requires_passphrase: boolean;
  expires_at: string | null;
  is_burned: boolean;
}

export interface ViewSecretResponse {
  content: string;
  is_burned: boolean;
  views_remaining: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new ApiError(error.error, error.code, response.status);
  }

  return data as T;
}

export async function createSecret(request: CreateSecretRequest): Promise<CreateSecretResponse> {
  const response = await fetch(`${API_URL}/api/secrets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse<CreateSecretResponse>(response);
}

export async function getSecretMetadata(id: string): Promise<SecretMetadata> {
  const response = await fetch(`${API_URL}/api/secrets/${id}/metadata`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<SecretMetadata>(response);
}

export async function viewSecret(id: string, passphrase?: string): Promise<ViewSecretResponse> {
  const response = await fetch(`${API_URL}/api/secrets/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ passphrase }),
  });

  return handleResponse<ViewSecretResponse>(response);
}

export const TTL_OPTIONS = [
  { value: 300, label: '5 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '1 day' },
  { value: 604800, label: '7 days' },
  { value: 2592000, label: '30 days' },
];
