"use client";

import { useState, useEffect, use } from "react";
import { getSecretMetadata, viewSecret, SecretMetadata, ApiError } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SecretPage({ params }: PageProps) {
  const { id } = use(params);
  const [metadata, setMetadata] = useState<SecretMetadata | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, [id]);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const data = await getSecretMetadata(id);
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load secret");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setRevealing(true);

    try {
      const response = await viewSecret(id, passphrase || undefined);
      setContent(response.content);
      setRevealed(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to reveal secret");
      }
    } finally {
      setRevealing(false);
    }
  };

  const copyToClipboard = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
          </div>
          <p className="text-[var(--text-secondary)]">Loading secret...</p>
        </div>
      </div>
    );
  }

  // IMPORTANT: Check if content was revealed FIRST (before checking if burned)
  if (revealed && content !== null) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="card-elevated p-6 sm:p-8 animate-scale-in glow-success">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-green-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Secret Revealed</h2>
                <p className="text-sm text-[var(--text-muted)]">This message has been destroyed from the server</p>
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className={`btn ${copied ? "btn-primary" : "btn-secondary"}`}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="code-block mb-6 max-h-[400px] overflow-y-auto">
            {content}
          </div>

          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <div>
              <p className="font-medium">Secret Permanently Destroyed</p>
              <p className="text-sm opacity-80">
                This secret has been deleted from the server. Save it now if needed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Create Your Own Secret
          </a>
        </div>
      </div>
    );
  }

  // Secret doesn't exist or is burned (and we haven't revealed it)
  if (metadata && (!metadata.exists || metadata.is_burned)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="card-elevated p-8 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--text-muted)]">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            {metadata.is_burned ? "Secret Destroyed" : "Secret Not Found"}
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
            {metadata.is_burned
              ? "This secret has been permanently destroyed and can no longer be accessed."
              : "This secret either never existed, has already been viewed, or has expired."}
          </p>
          <a href="/" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Create a New Secret
          </a>
        </div>
      </div>
    );
  }

  // Show reveal form
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="card-elevated p-6 sm:p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--accent-primary-light)]">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Encrypted Secret Awaits
          </h2>
          <p className="text-[var(--text-secondary)]">
            Someone shared a secure message with you. Once revealed, it will be destroyed.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div>
            <p className="font-medium">One-Time Access Warning</p>
            <p className="text-sm opacity-80">
              This secret will self-destruct after viewing. Make sure you&apos;re ready to save it.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Metadata Info */}
        {metadata && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[var(--text-muted)]">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-xs text-[var(--text-muted)]">Expires</p>
              </div>
              <p className="text-sm text-[var(--text-primary)]">
                {metadata.expires_at
                  ? new Date(metadata.expires_at).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[var(--text-muted)]">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-xs text-[var(--text-muted)]">Protection</p>
              </div>
              <p className="text-sm text-[var(--text-primary)]">
                {metadata.requires_passphrase ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Passphrase Required
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    No Passphrase
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Passphrase Form (if required) */}
        <form onSubmit={handleReveal}>
          {metadata?.requires_passphrase && (
            <div className="mb-6">
              <label className="label">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Enter Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter the passphrase..."
                className="input"
                required
                autoFocus
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
                The sender should have shared this passphrase with you separately
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={revealing || (metadata?.requires_passphrase && !passphrase)}
            className="btn btn-primary w-full py-4"
          >
            {revealing ? (
              <>
                <div className="spinner" />
                Decrypting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Reveal Secret
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-[var(--text-muted)] text-center mt-6">
          Encrypted with AES-256-GCM military-grade encryption
        </p>
      </div>
    </div>
  );
}
