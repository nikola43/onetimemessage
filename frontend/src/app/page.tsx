"use client";

import { useState } from "react";
import { createSecret, TTL_OPTIONS, CreateSecretResponse } from "@/lib/api";

export default function Home() {
  const [content, setContent] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [ttl, setTtl] = useState(604800);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateSecretResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await createSecret({
        content,
        passphrase: passphrase || undefined,
        ttl_seconds: ttl,
        max_views: 1,
        burn_after_reading: true,
      });
      setResult(response);
      setContent("");
      setPassphrase("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create secret");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setResult(null);
    setCopied(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm text-[var(--text-secondary)]">
            256-bit AES-GCM Encryption
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          <span className="text-[var(--text-primary)]">Share Secrets</span>
          <br />
          <span className="gradient-text">That Self-Destruct</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Create encrypted, one-time messages that vanish after being read.
          Military-grade security for your sensitive information.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
        {[
          {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            ),
            title: "Military-Grade",
            desc: "AES-256-GCM encryption",
            color: "primary",
          },
          {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ),
            title: "Self-Destruct",
            desc: "Auto-deleted after viewing",
            color: "danger",
          },
          {
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ),
            title: "Passphrase",
            desc: "Optional extra security",
            color: "success",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="card p-6 animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`feature-icon feature-icon-${feature.color} mb-4`}>
              {feature.icon}
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Form or Result */}
      {result ? (
        <div className="card-elevated p-6 sm:p-8 animate-scale-in glow-success">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
                <path d="m9 12 2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Secret Created Successfully
            </h3>
            <p className="text-[var(--text-secondary)]">
              Share this link with your recipient. It will self-destruct after being viewed.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-6">
            <label className="label mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Share URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={result.share_url}
                readOnly
                className="input font-mono text-sm flex-1"
              />
              <button
                onClick={copyToClipboard}
                className={`btn ${copied ? "btn-primary" : "btn-secondary"} px-4`}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Secret ID</p>
              <p className="font-mono text-sm text-[var(--text-primary)]">
                {result.id.substring(0, 12)}...
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Expires</p>
              <p className="text-sm text-[var(--text-primary)]">
                {new Date(result.expires_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="alert alert-warning mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <div>
              <p className="font-medium">One-Time Access Only</p>
              <p className="text-sm opacity-80">
                This link can only be viewed once. After viewing, it will be permanently destroyed.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={resetForm} className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Create Another Secret
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-elevated p-6 sm:p-8 animate-slide-up">
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

          <div className="mb-6">
            <label className="label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Your Secret Message
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your sensitive information here..."
              rows={6}
              className="textarea"
              required
              maxLength={1048576}
            />
            <div className="flex justify-between mt-2">
              <p className="text-xs text-[var(--text-muted)]">
                Encrypted with AES-256-GCM before storage
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {content.length.toLocaleString()} / 1,048,576
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="label">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Passphrase (Optional)
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Add extra security..."
                className="input"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Recipient will need this to view the secret
              </p>
            </div>

            <div>
              <label className="label">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Expires After
              </label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="select"
              >
                {TTL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn btn-primary w-full py-4"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Encrypting Secret...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Create Encrypted Secret
              </>
            )}
          </button>
        </form>
      )}

      {/* How it works */}
      <div className="mt-16 sm:mt-20">
        <div className="text-center mb-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
            How It Works
          </h3>
          <p className="text-[var(--text-secondary)]">
            Secure secret sharing in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              ),
              title: "Write",
              desc: "Enter your secret message",
            },
            {
              step: 2,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ),
              title: "Encrypt",
              desc: "AES-256-GCM encryption",
            },
            {
              step: 3,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" x2="12" y1="2" y2="15" />
                </svg>
              ),
              title: "Share",
              desc: "Send the unique link",
            },
            {
              step: 4,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              ),
              title: "Destroy",
              desc: "Auto-deleted after viewing",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="relative animate-slide-up"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="card p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="feature-icon feature-icon-primary">
                    {item.icon}
                  </div>
                </div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-[var(--border-secondary)]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="mt-16 sm:mt-20 card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[var(--accent-primary-light)]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
          Security First
        </h3>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-6">
          Your secrets are encrypted client-side and server-side using AES-256-GCM,
          the same encryption standard used by governments and military organizations worldwide.
          Once viewed, secrets are permanently and irreversibly deleted from our servers.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="badge badge-primary">AES-256-GCM</span>
          <span className="badge badge-success">PBKDF2</span>
          <span className="badge badge-warning">Rate Limited</span>
          <span className="badge badge-danger">Auto-Destruct</span>
        </div>
      </div>
    </div>
  );
}
