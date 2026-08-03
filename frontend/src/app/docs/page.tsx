"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ApiResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"docs" | "playground">("docs");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("create");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  // Form states
  const [secretContent, setSecretContent] = useState("Hello, this is a test secret!");
  const [passphrase, setPassphrase] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState("86400");
  const [secretId, setSecretId] = useState("");
  const [viewPassphrase, setViewPassphrase] = useState("");

  const endpoints = [
    {
      id: "create",
      method: "POST",
      path: "/api/secrets",
      title: "Create Secret",
      description: "Create a new encrypted secret message",
    },
    {
      id: "metadata",
      method: "GET",
      path: "/api/secrets/{id}/metadata",
      title: "Get Metadata",
      description: "Check if a secret exists and its properties",
    },
    {
      id: "view",
      method: "POST",
      path: "/api/secrets/{id}",
      title: "View Secret",
      description: "Retrieve and decrypt a secret (destroys after viewing)",
    },
    {
      id: "burn",
      method: "DELETE",
      path: "/api/secrets/{id}",
      title: "Burn Secret",
      description: "Manually destroy a secret before it expires",
    },
    {
      id: "health",
      method: "GET",
      path: "/health",
      title: "Health Check",
      description: "Check API and database status",
    },
    {
      id: "stats",
      method: "GET",
      path: "/api/stats",
      title: "Statistics",
      description: "Get server statistics and metrics",
    },
  ];

  const executeRequest = async () => {
    setLoading(true);
    setResponse(null);

    try {
      let url = API_URL;
      let options: RequestInit = {
        headers: { "Content-Type": "application/json" },
      };

      switch (selectedEndpoint) {
        case "create":
          url += "/api/secrets";
          options.method = "POST";
          options.body = JSON.stringify({
            content: secretContent,
            passphrase: passphrase || undefined,
            ttl_seconds: parseInt(ttlSeconds) || 86400,
          });
          break;
        case "metadata":
          url += `/api/secrets/${secretId}/metadata`;
          options.method = "GET";
          break;
        case "view":
          url += `/api/secrets/${secretId}`;
          options.method = "POST";
          options.body = JSON.stringify({
            passphrase: viewPassphrase || undefined,
          });
          break;
        case "burn":
          url += `/api/secrets/${secretId}`;
          options.method = "DELETE";
          break;
        case "health":
          url += "/health";
          options.method = "GET";
          break;
        case "stats":
          url += "/api/stats";
          options.method = "GET";
          break;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      setResponse({
        status: res.status,
        data,
        headers,
      });

      // If we created a secret, auto-fill the ID for convenience
      if (selectedEndpoint === "create" && data.id) {
        setSecretId(data.id);
      }
    } catch (err) {
      setResponse({
        status: 0,
        data: { error: err instanceof Error ? err.message : "Request failed" },
        headers: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "POST":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DELETE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 400 && status < 500) return "text-yellow-400";
    if (status >= 500) return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[var(--accent-primary-light)]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="text-sm font-medium text-[var(--accent-primary-light)]">REST API v1.0</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">API Documentation</span>
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Integrate OneTimeMessage into your applications. Create, retrieve, and manage encrypted secrets programmatically.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-[var(--bg-tertiary)] p-1">
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "docs"
                ? "bg-[var(--accent-primary)] text-white shadow-lg"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "playground"
                ? "bg-[var(--accent-primary)] text-white shadow-lg"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            API Playground
          </button>
        </div>
      </div>

      {activeTab === "docs" ? (
        /* Documentation Tab */
        <div className="space-y-8">
          {/* Base URL */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Base URL</h2>
            <div className="code-block">
              {API_URL}
            </div>
          </div>

          {/* Authentication */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Authentication</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              The API is currently open and does not require authentication. Rate limiting is applied per IP address.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                <p className="text-sm text-[var(--text-muted)] mb-1">General Requests</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">100/min</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                <p className="text-sm text-[var(--text-muted)] mb-1">Create Secret</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">20/min</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                <p className="text-sm text-[var(--text-muted)] mb-1">View Secret</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">10/min per secret</p>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Endpoints</h2>

            {/* Create Secret */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor("POST")}`}>POST</span>
                <code className="text-[var(--text-primary)] font-mono">/api/secrets</code>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">Create a new encrypted secret message.</p>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Request Body</h4>
              <div className="code-block mb-6 text-sm">
{`{
  "content": "string",         // Required: The secret message (max 1MB)
  "passphrase": "string",      // Optional: Password protection
  "ttl_seconds": 86400,        // Optional: Time to live (60-2592000)
  "max_views": 1,              // Optional: Maximum view count
  "burn_after_reading": true   // Optional: Delete after viewing
}`}
              </div>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Response (201 Created)</h4>
              <div className="code-block text-sm">
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2024-01-15T12:00:00Z",
  "share_url": "http://localhost:3000/secret/550e8400-..."
}`}
              </div>
            </div>

            {/* Get Metadata */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor("GET")}`}>GET</span>
                <code className="text-[var(--text-primary)] font-mono">/api/secrets/{"{id}"}/metadata</code>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">Check if a secret exists and get its metadata without revealing it.</p>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Response (200 OK)</h4>
              <div className="code-block text-sm">
{`{
  "exists": true,
  "requires_passphrase": true,
  "expires_at": "2024-01-15T12:00:00Z",
  "is_burned": false
}`}
              </div>
            </div>

            {/* View Secret */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor("POST")}`}>POST</span>
                <code className="text-[var(--text-primary)] font-mono">/api/secrets/{"{id}"}</code>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">Retrieve and decrypt a secret. The secret is destroyed after viewing if burn_after_reading is enabled.</p>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Request Body</h4>
              <div className="code-block mb-6 text-sm">
{`{
  "passphrase": "string"  // Required if secret is password-protected
}`}
              </div>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Response (200 OK)</h4>
              <div className="code-block text-sm">
{`{
  "content": "The decrypted secret message",
  "is_burned": true,
  "views_remaining": 0
}`}
              </div>
            </div>

            {/* Burn Secret */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor("DELETE")}`}>DELETE</span>
                <code className="text-[var(--text-primary)] font-mono">/api/secrets/{"{id}"}</code>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">Manually destroy a secret before it expires or is viewed.</p>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Response (200 OK)</h4>
              <div className="code-block text-sm">
{`{
  "success": true,
  "message": "Secret has been burned"
}`}
              </div>
            </div>

            {/* Health Check */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor("GET")}`}>GET</span>
                <code className="text-[var(--text-primary)] font-mono">/health</code>
              </div>
              <p className="text-[var(--text-secondary)] mb-6">Check the health status of the API and database.</p>

              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Response (200 OK)</h4>
              <div className="code-block text-sm">
{`{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "database": "ok"
}`}
              </div>
            </div>
          </div>

          {/* Error Codes */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Error Codes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-primary)]">
                    <th className="text-left py-3 px-4 text-[var(--text-muted)]">Status</th>
                    <th className="text-left py-3 px-4 text-[var(--text-muted)]">Code</th>
                    <th className="text-left py-3 px-4 text-[var(--text-muted)]">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-secondary)]">
                  <tr className="border-b border-[var(--border-secondary)]">
                    <td className="py-3 px-4 text-yellow-400">400</td>
                    <td className="py-3 px-4 font-mono text-xs">INVALID_JSON</td>
                    <td className="py-3 px-4">Invalid request body</td>
                  </tr>
                  <tr className="border-b border-[var(--border-secondary)]">
                    <td className="py-3 px-4 text-yellow-400">403</td>
                    <td className="py-3 px-4 font-mono text-xs">PASSPHRASE_REQUIRED</td>
                    <td className="py-3 px-4">Secret requires a passphrase</td>
                  </tr>
                  <tr className="border-b border-[var(--border-secondary)]">
                    <td className="py-3 px-4 text-yellow-400">403</td>
                    <td className="py-3 px-4 font-mono text-xs">INVALID_PASSPHRASE</td>
                    <td className="py-3 px-4">Incorrect passphrase provided</td>
                  </tr>
                  <tr className="border-b border-[var(--border-secondary)]">
                    <td className="py-3 px-4 text-yellow-400">404</td>
                    <td className="py-3 px-4 font-mono text-xs">SECRET_NOT_FOUND</td>
                    <td className="py-3 px-4">Secret does not exist</td>
                  </tr>
                  <tr className="border-b border-[var(--border-secondary)]">
                    <td className="py-3 px-4 text-yellow-400">410</td>
                    <td className="py-3 px-4 font-mono text-xs">SECRET_BURNED</td>
                    <td className="py-3 px-4">Secret has been destroyed</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-yellow-400">429</td>
                    <td className="py-3 px-4 font-mono text-xs">RATE_LIMIT_EXCEEDED</td>
                    <td className="py-3 px-4">Too many requests</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Swagger UI Link */}
          <div className="card p-6 text-center">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Interactive Swagger UI</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Prefer Swagger? Access the full OpenAPI specification with interactive documentation.
            </p>
            <a
              href={`${API_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open Swagger UI
            </a>
          </div>
        </div>
      ) : (
        /* Playground Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Panel */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Select Endpoint</h3>
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      selectedEndpoint === endpoint.id
                        ? "bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/50"
                        : "bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-primary)]"
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{endpoint.title}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate font-mono">{endpoint.path}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Parameters</h3>

              {selectedEndpoint === "create" && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Secret Content *</label>
                    <textarea
                      value={secretContent}
                      onChange={(e) => setSecretContent(e.target.value)}
                      placeholder="Enter your secret message..."
                      rows={4}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Passphrase (Optional)</label>
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Optional password protection"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">TTL (seconds)</label>
                    <input
                      type="number"
                      value={ttlSeconds}
                      onChange={(e) => setTtlSeconds(e.target.value)}
                      placeholder="86400"
                      className="input"
                    />
                  </div>
                </div>
              )}

              {(selectedEndpoint === "metadata" || selectedEndpoint === "view" || selectedEndpoint === "burn") && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Secret ID *</label>
                    <input
                      type="text"
                      value={secretId}
                      onChange={(e) => setSecretId(e.target.value)}
                      placeholder="550e8400-e29b-41d4-a716-446655440000"
                      className="input font-mono text-sm"
                    />
                  </div>
                  {selectedEndpoint === "view" && (
                    <div>
                      <label className="label">Passphrase (if required)</label>
                      <input
                        type="password"
                        value={viewPassphrase}
                        onChange={(e) => setViewPassphrase(e.target.value)}
                        placeholder="Enter passphrase if protected"
                        className="input"
                      />
                    </div>
                  )}
                </div>
              )}

              {(selectedEndpoint === "health" || selectedEndpoint === "stats") && (
                <p className="text-[var(--text-muted)] text-sm">No parameters required for this endpoint.</p>
              )}

              <button
                onClick={executeRequest}
                disabled={loading}
                className="btn btn-primary w-full mt-6"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Panel */}
          <div className="card p-6 h-fit lg:sticky lg:top-24">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Response</h3>

            {response ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getStatusColor(response.status)}`}>
                    {response.status}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {response.status === 200 ? "OK" :
                     response.status === 201 ? "Created" :
                     response.status === 400 ? "Bad Request" :
                     response.status === 403 ? "Forbidden" :
                     response.status === 404 ? "Not Found" :
                     response.status === 410 ? "Gone" :
                     response.status === 429 ? "Too Many Requests" :
                     response.status === 0 ? "Network Error" : "Error"}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Response Body</h4>
                  <div className="code-block text-sm max-h-[400px] overflow-auto">
                    <pre>{JSON.stringify(response.data, null, 2)}</pre>
                  </div>
                </div>

                {Object.keys(response.headers).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Headers</h4>
                    <div className="code-block text-xs max-h-[200px] overflow-auto">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-[var(--accent-primary-light)]">{key}</span>: {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[var(--text-muted)]">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <p className="text-[var(--text-muted)]">
                  Send a request to see the response here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
