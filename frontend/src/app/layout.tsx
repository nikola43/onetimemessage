import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OneTimeMessage - Self-Destructing Encrypted Messages",
  description:
    "Share sensitive information securely with self-destructing encrypted messages. Military-grade AES-256-GCM encryption ensures your secrets stay private.",
  keywords: [
    "secure messaging",
    "self-destructing messages",
    "encryption",
    "privacy",
    "one-time secret",
    "AES-256",
    "secure sharing",
    "encrypted notes",
  ],
  authors: [{ name: "OneTimeMessage" }],
  creator: "OneTimeMessage",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "OneTimeMessage - Self-Destructing Encrypted Messages",
    description:
      "Share sensitive information securely with self-destructing encrypted messages.",
    siteName: "OneTimeMessage",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneTimeMessage - Self-Destructing Encrypted Messages",
    description:
      "Share sensitive information securely with self-destructing encrypted messages.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="glass sticky top-0 z-50 border-b border-[var(--border-secondary)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20 group-hover:shadow-[var(--accent-primary)]/40 transition-shadow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-white"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary-light)] transition-colors">
                      OneTimeMessage
                    </h1>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                      AES-256 Encrypted
                    </p>
                  </div>
                </a>

                <nav className="hidden sm:flex items-center gap-6">
                  <a
                    href="/"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Create Secret
                  </a>
                  <a
                    href="/docs"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    API Docs
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                </nav>

                {/* Mobile menu button */}
                <button className="sm:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-[var(--text-secondary)]"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50 mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                {/* Brand */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-white"
                      >
                        <rect
                          width="18"
                          height="11"
                          x="3"
                          y="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">
                      OneTimeMessage
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] max-w-md">
                    Secure, self-destructing messages with military-grade
                    AES-256-GCM encryption. Your secrets are encrypted before
                    storage and automatically destroyed after viewing.
                  </p>
                </div>

                {/* Links */}
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-4">
                    Product
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="/"
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Create Secret
                      </a>
                    </li>
                    <li>
                      <a
                        href="/docs"
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        API Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Security
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Tech Stack */}
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-4">
                    Tech Stack
                  </h4>
                  <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      Rust + may_minihttp
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      MySQL + Diesel ORM
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      Next.js 16
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      AES-256-GCM
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="pt-8 border-t border-[var(--border-secondary)] flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-[var(--text-muted)]">
                  &copy; {new Date().getFullYear()} OneTimeMessage. All rights
                  reserved.
                </p>
                <div className="flex items-center gap-4">
                  <span className="badge badge-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
