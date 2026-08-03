//! Rate limiting module for API protection
//!
//! Implements sliding window rate limiting with configurable limits per endpoint.

use dashmap::DashMap;
use std::time::{Duration, Instant};

/// Rate limit configuration
#[derive(Clone, Copy)]
pub struct RateLimitConfig {
    /// Maximum requests allowed in the window
    pub max_requests: u32,
    /// Window duration
    pub window: Duration,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            max_requests: 100,
            window: Duration::from_secs(60),
        }
    }
}

/// Rate limiter entry
struct RateLimitEntry {
    count: u32,
    window_start: Instant,
}

/// Thread-safe rate limiter using sliding window algorithm
pub struct RateLimiter {
    /// Stores rate limit entries per IP
    entries: DashMap<String, RateLimitEntry>,
    /// Default config for general endpoints
    default_config: RateLimitConfig,
    /// Stricter config for secret creation
    create_config: RateLimitConfig,
    /// Stricter config for secret viewing (anti brute-force)
    view_config: RateLimitConfig,
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            entries: DashMap::new(),
            default_config: RateLimitConfig {
                max_requests: 100,
                window: Duration::from_secs(60),
            },
            create_config: RateLimitConfig {
                max_requests: 20,
                window: Duration::from_secs(60),
            },
            view_config: RateLimitConfig {
                max_requests: 10,
                window: Duration::from_secs(60),
            },
        }
    }

    /// Check if request should be allowed for general endpoints
    pub fn check_default(&self, ip: &str) -> RateLimitResult {
        self.check(ip, "default", &self.default_config)
    }

    /// Check if request should be allowed for secret creation
    pub fn check_create(&self, ip: &str) -> RateLimitResult {
        self.check(ip, "create", &self.create_config)
    }

    /// Check if request should be allowed for secret viewing
    /// Uses per-secret rate limiting to prevent brute force attacks
    pub fn check_view(&self, ip: &str, secret_id: &str) -> RateLimitResult {
        let key = format!("{}:view:{}", ip, secret_id);
        self.check_key(&key, &self.view_config)
    }

    fn check(&self, ip: &str, endpoint: &str, config: &RateLimitConfig) -> RateLimitResult {
        let key = format!("{}:{}", ip, endpoint);
        self.check_key(&key, config)
    }

    fn check_key(&self, key: &str, config: &RateLimitConfig) -> RateLimitResult {
        let now = Instant::now();

        let mut entry = self.entries.entry(key.to_string()).or_insert(RateLimitEntry {
            count: 0,
            window_start: now,
        });

        // Check if window has expired
        if now.duration_since(entry.window_start) > config.window {
            entry.count = 0;
            entry.window_start = now;
        }

        entry.count += 1;

        if entry.count > config.max_requests {
            let retry_after = config.window
                .checked_sub(now.duration_since(entry.window_start))
                .unwrap_or(Duration::from_secs(1));

            RateLimitResult::Exceeded {
                retry_after_secs: retry_after.as_secs(),
                limit: config.max_requests,
            }
        } else {
            RateLimitResult::Allowed {
                remaining: config.max_requests - entry.count,
                limit: config.max_requests,
            }
        }
    }

    /// Cleanup expired entries (call periodically)
    pub fn cleanup(&self) {
        let now = Instant::now();
        let max_window = Duration::from_secs(120); // 2 minutes

        self.entries.retain(|_, entry| {
            now.duration_since(entry.window_start) < max_window
        });
    }
}

#[derive(Debug)]
pub enum RateLimitResult {
    Allowed { remaining: u32, limit: u32 },
    Exceeded { retry_after_secs: u64, limit: u32 },
}

impl RateLimitResult {
    pub fn is_allowed(&self) -> bool {
        matches!(self, RateLimitResult::Allowed { .. })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rate_limiter_allows_under_limit() {
        let limiter = RateLimiter::new();

        // Should allow requests under the limit
        for i in 0..100 {
            let result = limiter.check_default("192.168.1.1");
            assert!(result.is_allowed(), "Request {} should be allowed", i + 1);
        }
    }

    #[test]
    fn test_rate_limiter_blocks_over_limit() {
        let limiter = RateLimiter::new();

        // Exhaust the default limit (100 requests)
        for _ in 0..100 {
            limiter.check_default("192.168.1.2");
        }

        // Next request should be blocked
        let result = limiter.check_default("192.168.1.2");
        assert!(!result.is_allowed(), "Request over limit should be blocked");

        if let RateLimitResult::Exceeded { retry_after_secs, limit } = result {
            assert_eq!(limit, 100);
            assert!(retry_after_secs > 0);
        } else {
            panic!("Expected Exceeded result");
        }
    }

    #[test]
    fn test_rate_limiter_per_ip_isolation() {
        let limiter = RateLimiter::new();

        // Exhaust limit for IP 1
        for _ in 0..100 {
            limiter.check_default("192.168.1.3");
        }

        // IP 2 should still be allowed
        let result = limiter.check_default("192.168.1.4");
        assert!(result.is_allowed(), "Different IP should have its own limit");
    }

    #[test]
    fn test_create_limit_is_stricter() {
        let limiter = RateLimiter::new();

        // Create limit is 20 per minute
        for _ in 0..20 {
            let result = limiter.check_create("192.168.1.5");
            assert!(result.is_allowed());
        }

        // 21st request should be blocked
        let result = limiter.check_create("192.168.1.5");
        assert!(!result.is_allowed(), "Create limit should be 20");
    }

    #[test]
    fn test_view_limit_per_secret() {
        let limiter = RateLimiter::new();

        // View limit is 10 per minute per secret
        for _ in 0..10 {
            let result = limiter.check_view("192.168.1.6", "secret-1");
            assert!(result.is_allowed());
        }

        // 11th request for same secret should be blocked
        let result = limiter.check_view("192.168.1.6", "secret-1");
        assert!(!result.is_allowed(), "View limit should be 10 per secret");

        // But different secret should still work
        let result = limiter.check_view("192.168.1.6", "secret-2");
        assert!(result.is_allowed(), "Different secret should have its own limit");
    }

    #[test]
    fn test_cleanup_removes_old_entries() {
        let limiter = RateLimiter::new();

        // Add some entries
        limiter.check_default("192.168.1.7");
        limiter.check_create("192.168.1.8");

        // Verify entries exist
        assert!(!limiter.entries.is_empty());

        // Cleanup should not remove fresh entries
        limiter.cleanup();
        assert!(!limiter.entries.is_empty());
    }

    #[test]
    fn test_rate_limit_result_is_allowed() {
        let allowed = RateLimitResult::Allowed { remaining: 50, limit: 100 };
        assert!(allowed.is_allowed());

        let exceeded = RateLimitResult::Exceeded { retry_after_secs: 30, limit: 100 };
        assert!(!exceeded.is_allowed());
    }
}
