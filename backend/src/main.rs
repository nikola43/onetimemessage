mod crypto;
mod db;
mod models;
mod openapi;
mod rate_limit;
mod schema;

use chrono::{Duration, Utc};
use diesel::prelude::*;
use may_minihttp::{HttpServer, HttpService, Request, Response};
use std::env;
use std::io::{self, Read};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::crypto::Crypto;
use crate::db::{establish_connection_pool, get_connection, DbPool};
use crate::models::*;
use crate::openapi::{get_openapi_spec, SWAGGER_UI_HTML};
use crate::rate_limit::{RateLimitResult, RateLimiter};
use crate::schema::secrets;

const VERSION: &str = env!("CARGO_PKG_VERSION");
const MAX_SECRET_SIZE: usize = 1024 * 1024; // 1MB max
const DEFAULT_TTL_SECONDS: i64 = 7 * 24 * 60 * 60; // 7 days
const MIN_TTL_SECONDS: i64 = 60; // 1 minute minimum
const MAX_TTL_SECONDS: i64 = 30 * 24 * 60 * 60; // 30 days
const MAX_VIEWS_LIMIT: i32 = 100; // Maximum views per secret

/// Server statistics
struct Stats {
    secrets_created: AtomicU64,
    secrets_viewed: AtomicU64,
    start_time: Instant,
}

impl Stats {
    fn new() -> Self {
        Self {
            secrets_created: AtomicU64::new(0),
            secrets_viewed: AtomicU64::new(0),
            start_time: Instant::now(),
        }
    }
}

#[derive(Clone)]
struct AppState {
    pool: Arc<DbPool>,
    crypto: Arc<Crypto>,
    rate_limiter: Arc<RateLimiter>,
    stats: Arc<Stats>,
    frontend_url: String,
}

fn read_body(req: Request) -> (String, String, Option<Vec<u8>>, Option<String>) {
    let method = req.method().to_string();
    let path = req.path().to_string();

    // Try to extract client IP from X-Forwarded-For or X-Real-IP headers
    // For may_minihttp, we need to check headers manually
    let client_ip = None; // may_minihttp doesn't expose headers easily for reading

    let mut body_reader = req.body();
    let mut buf = Vec::new();
    let body = match body_reader.read_to_end(&mut buf) {
        Ok(0) => None,
        Ok(_) => Some(buf),
        Err(_) => None,
    };
    (method, path, body, client_ip)
}

fn add_security_headers(res: &mut Response, is_html: bool) {
    // CORS headers - use wildcard for simplicity (configured at reverse proxy in production)
    res.header("Access-Control-Allow-Origin: *");
    res.header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers: Content-Type, X-API-Key, X-Request-ID");
    res.header("Access-Control-Max-Age: 86400");

    // Security headers
    res.header("X-Content-Type-Options: nosniff");
    res.header("X-Frame-Options: DENY");
    res.header("X-XSS-Protection: 1; mode=block");
    res.header("Referrer-Policy: strict-origin-when-cross-origin");
    res.header("Permissions-Policy: geolocation=(), microphone=(), camera=()");

    if is_html {
        // Relaxed CSP for Swagger UI (needs external scripts/styles)
        res.header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data:; font-src 'self' https://unpkg.com");
        res.header("Content-Type: text/html; charset=utf-8");
    } else {
        // Strict CSP for API endpoints
        res.header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
        res.header("Cache-Control: no-store, no-cache, must-revalidate, private");
        res.header("Pragma: no-cache");
        res.header("Content-Type: application/json");
    }
}

// Pre-defined rate limit headers to avoid memory allocation per request
const RATE_LIMIT_HEADERS: [&str; 6] = [
    "X-RateLimit-Limit: 10",
    "X-RateLimit-Limit: 20",
    "X-RateLimit-Limit: 100",
    "X-RateLimit-Remaining: 0",
    "Retry-After: 60",
    "Retry-After: 30",
];

fn add_rate_limit_headers(res: &mut Response, result: &RateLimitResult) {
    match result {
        RateLimitResult::Allowed { remaining: _, limit } => {
            // Use pre-defined headers for common limits
            match *limit {
                10 => res.header(RATE_LIMIT_HEADERS[0]),
                20 => res.header(RATE_LIMIT_HEADERS[1]),
                100 => res.header(RATE_LIMIT_HEADERS[2]),
                _ => res.header(RATE_LIMIT_HEADERS[2]), // Default to 100
            };
        }
        RateLimitResult::Exceeded { retry_after_secs: _, limit } => {
            match *limit {
                10 => res.header(RATE_LIMIT_HEADERS[0]),
                20 => res.header(RATE_LIMIT_HEADERS[1]),
                100 => res.header(RATE_LIMIT_HEADERS[2]),
                _ => res.header(RATE_LIMIT_HEADERS[2]),
            };
            res.header(RATE_LIMIT_HEADERS[3]); // Remaining: 0
            res.header(RATE_LIMIT_HEADERS[4]); // Retry-After: 60
        }
    }
}

impl HttpService for AppState {
    fn call(&mut self, req: Request, res: &mut Response) -> io::Result<()> {
        // Read body and extract info (consumes req)
        let (method, path, body, client_ip) = read_body(req);
        let ip = client_ip.unwrap_or_else(|| "unknown".to_string());

        // Check if this is an HTML response (Swagger UI)
        let is_html = matches!(path.as_str(), "/docs" | "/swagger");

        // Add security headers with appropriate CSP
        add_security_headers(res, is_html);

        // Handle preflight requests
        if method == "OPTIONS" {
            res.status_code(204, "No Content");
            return Ok(());
        }

        // Route the request
        match (method.as_str(), path.as_str()) {
            // Health check endpoint
            ("GET", "/health") => {
                self.handle_health(res);
            }

            // API documentation
            ("GET", "/api/docs") => {
                res.status_code(200, "OK");
                res.body_vec(get_openapi_spec().into_bytes());
            }

            // Swagger UI
            ("GET", "/docs") | ("GET", "/swagger") => {
                res.status_code(200, "OK");
                res.body_vec(SWAGGER_UI_HTML.as_bytes().to_vec());
            }

            // Stats endpoint
            ("GET", "/api/stats") => {
                self.handle_stats(res);
            }

            // Create secret
            ("POST", "/api/secrets") => {
                let rate_result = self.rate_limiter.check_create(&ip);
                add_rate_limit_headers(res, &rate_result);

                if !rate_result.is_allowed() {
                    warn!(ip = %ip, "Rate limit exceeded for secret creation");
                    self.send_error(res, 429, "Rate limit exceeded. Please try again later.", "RATE_LIMIT_EXCEEDED");
                    return Ok(());
                }

                self.handle_create_secret(body, res);
            }

            // Get secret metadata
            ("GET", p) if p.starts_with("/api/secrets/") && p.ends_with("/metadata") => {
                let rate_result = self.rate_limiter.check_default(&ip);
                add_rate_limit_headers(res, &rate_result);

                if !rate_result.is_allowed() {
                    self.send_error(res, 429, "Rate limit exceeded", "RATE_LIMIT_EXCEEDED");
                    return Ok(());
                }

                let id = p
                    .strip_prefix("/api/secrets/")
                    .and_then(|s| s.strip_suffix("/metadata"))
                    .unwrap_or("");
                self.handle_get_metadata(id, res);
            }

            // View secret
            ("POST", p) if p.starts_with("/api/secrets/") && !p.ends_with("/metadata") => {
                let id = p.strip_prefix("/api/secrets/").unwrap_or("").to_string();

                // Use per-secret rate limiting to prevent brute force attacks
                let rate_result = self.rate_limiter.check_view(&ip, &id);
                add_rate_limit_headers(res, &rate_result);

                if !rate_result.is_allowed() {
                    warn!(ip = %ip, secret_id = %id, "Rate limit exceeded for secret viewing (possible brute force)");
                    self.send_error(res, 429, "Too many attempts. Please wait before trying again.", "RATE_LIMIT_EXCEEDED");
                    return Ok(());
                }

                self.handle_view_secret(&id, body, res);
            }

            // Burn secret
            ("DELETE", p) if p.starts_with("/api/secrets/") => {
                let rate_result = self.rate_limiter.check_default(&ip);
                add_rate_limit_headers(res, &rate_result);

                if !rate_result.is_allowed() {
                    self.send_error(res, 429, "Rate limit exceeded", "RATE_LIMIT_EXCEEDED");
                    return Ok(());
                }

                let id = p.strip_prefix("/api/secrets/").unwrap_or("");
                self.handle_burn_secret(id, res);
            }

            _ => {
                self.send_error(res, 404, "Not found", "NOT_FOUND");
            }
        }

        Ok(())
    }
}

impl AppState {
    fn handle_health(&self, res: &mut Response) {
        let uptime = self.stats.start_time.elapsed().as_secs();

        // Check database connectivity
        let db_status = match get_connection(&self.pool).execute_returning_count(
            &diesel::sql_query("SELECT 1")
        ) {
            Ok(_) => "ok",
            Err(_) => "error",
        };

        let status = if db_status == "ok" { "ok" } else { "degraded" };

        res.status_code(200, "OK");
        let body = format!(
            r#"{{"status":"{}","version":"{}","uptime_seconds":{},"database":"{}"}}"#,
            status, VERSION, uptime, db_status
        );
        res.body_vec(body.into_bytes());
    }

    fn handle_stats(&self, res: &mut Response) {
        let uptime = self.stats.start_time.elapsed().as_secs();
        let created = self.stats.secrets_created.load(Ordering::Relaxed);
        let viewed = self.stats.secrets_viewed.load(Ordering::Relaxed);

        // Get active secrets count from database using proper count query
        let mut conn = get_connection(&self.pool);
        let active_count: i64 = secrets::table
            .filter(secrets::is_burned.eq(false))
            .filter(secrets::expires_at.gt(Utc::now().naive_utc()))
            .count()
            .get_result(&mut conn)
            .unwrap_or(0);

        res.status_code(200, "OK");
        let body = format!(
            r#"{{"version":"{}","uptime_seconds":{},"secrets_created":{},"secrets_viewed":{},"active_secrets":{},"encryption":"AES-256-GCM","framework":"may_minihttp"}}"#,
            VERSION, uptime, created, viewed, active_count
        );
        res.body_vec(body.into_bytes());
    }

    fn handle_create_secret(&self, body: Option<Vec<u8>>, res: &mut Response) {
        // Parse request body
        let body = match body {
            Some(b) => b,
            None => {
                self.send_error(res, 400, "Missing request body", "MISSING_BODY");
                return;
            }
        };

        let body_str = match std::str::from_utf8(&body) {
            Ok(s) => s,
            Err(_) => {
                self.send_error(res, 400, "Invalid UTF-8 in request body", "INVALID_UTF8");
                return;
            }
        };

        let create_req: CreateSecretRequest = match serde_json::from_str(body_str) {
            Ok(r) => r,
            Err(e) => {
                self.send_error(res, 400, &format!("Invalid JSON: {}", e), "INVALID_JSON");
                return;
            }
        };

        // Validate content
        if create_req.content.is_empty() {
            self.send_error(res, 400, "Secret content cannot be empty", "CONTENT_EMPTY");
            return;
        }

        if create_req.content.len() > MAX_SECRET_SIZE {
            self.send_error(res, 400, "Secret content too large (max 1MB)", "CONTENT_TOO_LARGE");
            return;
        }

        // Validate passphrase if provided
        if let Some(ref p) = create_req.passphrase {
            if p.len() > 256 {
                self.send_error(res, 400, "Passphrase too long (max 256 characters)", "PASSPHRASE_TOO_LONG");
                return;
            }
        }

        // Generate secret ID
        let secret_id = Uuid::new_v4().to_string();

        // Calculate TTL with validation
        let ttl_seconds = create_req
            .ttl_seconds
            .unwrap_or(DEFAULT_TTL_SECONDS)
            .clamp(MIN_TTL_SECONDS, MAX_TTL_SECONDS);

        let expires_at = Utc::now().naive_utc() + Duration::seconds(ttl_seconds);

        // Validate and clamp max_views
        let max_views = create_req
            .max_views
            .unwrap_or(1)
            .clamp(1, MAX_VIEWS_LIMIT);

        // Encrypt the content
        let (encrypted_content, nonce) = match self.crypto.encrypt(create_req.content.as_bytes()) {
            Ok(result) => result,
            Err(e) => {
                error!(error = %e, "Encryption failed");
                self.send_error(res, 500, "Encryption failed", "ENCRYPTION_FAILED");
                return;
            }
        };

        // Hash passphrase if provided
        let passphrase_hash = create_req
            .passphrase
            .filter(|p| !p.is_empty())
            .map(|p| Crypto::hash_passphrase(&p));

        // Create new secret record
        let new_secret = NewSecret {
            id: secret_id.clone(),
            encrypted_content,
            nonce,
            passphrase_hash,
            expires_at,
            max_views,
            burn_after_reading: create_req.burn_after_reading.unwrap_or(true),
        };

        // Insert into database
        let mut conn = get_connection(&self.pool);
        match diesel::insert_into(secrets::table)
            .values(&new_secret)
            .execute(&mut conn)
        {
            Ok(_) => {
                self.stats.secrets_created.fetch_add(1, Ordering::Relaxed);

                info!(secret_id = %secret_id, ttl = ttl_seconds, "Secret created");

                let response = CreateSecretResponse {
                    id: secret_id.clone(),
                    expires_at: expires_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
                    share_url: format!("{}/secret/{}", self.frontend_url, secret_id),
                };

                res.status_code(201, "Created");
                let body = serde_json::to_string(&response).unwrap();
                res.body_vec(body.into_bytes());
            }
            Err(e) => {
                error!(error = %e, "Database error creating secret");
                self.send_error(res, 500, "Failed to create secret", "DATABASE_ERROR");
            }
        }
    }

    fn handle_get_metadata(&self, id: &str, res: &mut Response) {
        // Validate UUID format
        if Uuid::parse_str(id).is_err() {
            let metadata = SecretMetadata {
                exists: false,
                requires_passphrase: false,
                expires_at: None,
                is_burned: false,
            };
            res.status_code(200, "OK");
            let body = serde_json::to_string(&metadata).unwrap();
            res.body_vec(body.into_bytes());
            return;
        }

        let mut conn = get_connection(&self.pool);

        // Clean up expired secrets
        let _ = diesel::delete(
            secrets::table.filter(secrets::expires_at.lt(Utc::now().naive_utc())),
        )
        .execute(&mut conn);

        match secrets::table.filter(secrets::id.eq(id)).first::<Secret>(&mut conn) {
            Ok(secret) => {
                let metadata = SecretMetadata {
                    exists: !secret.is_burned && secret.view_count < secret.max_views,
                    requires_passphrase: secret.passphrase_hash.is_some(),
                    expires_at: Some(secret.expires_at.format("%Y-%m-%dT%H:%M:%SZ").to_string()),
                    is_burned: secret.is_burned,
                };

                res.status_code(200, "OK");
                let body = serde_json::to_string(&metadata).unwrap();
                res.body_vec(body.into_bytes());
            }
            Err(diesel::NotFound) => {
                let metadata = SecretMetadata {
                    exists: false,
                    requires_passphrase: false,
                    expires_at: None,
                    is_burned: false,
                };

                res.status_code(200, "OK");
                let body = serde_json::to_string(&metadata).unwrap();
                res.body_vec(body.into_bytes());
            }
            Err(e) => {
                error!(error = %e, "Database error fetching metadata");
                self.send_error(res, 500, "Database error", "DATABASE_ERROR");
            }
        }
    }

    fn handle_view_secret(&self, id: &str, body: Option<Vec<u8>>, res: &mut Response) {
        // Validate UUID format
        if Uuid::parse_str(id).is_err() {
            self.send_error(res, 404, "Secret not found", "SECRET_NOT_FOUND");
            return;
        }

        // Parse optional passphrase from body
        let view_req: Option<ViewSecretRequest> = body
            .and_then(|b| std::str::from_utf8(&b).ok().map(|s| s.to_string()))
            .and_then(|s| serde_json::from_str(&s).ok());

        let mut conn = get_connection(&self.pool);

        // Clean up expired secrets
        let _ = diesel::delete(
            secrets::table.filter(secrets::expires_at.lt(Utc::now().naive_utc())),
        )
        .execute(&mut conn);

        // Find the secret
        let secret: Secret = match secrets::table.filter(secrets::id.eq(id)).first(&mut conn) {
            Ok(s) => s,
            Err(diesel::NotFound) => {
                self.send_error(res, 404, "Secret not found or already viewed", "SECRET_NOT_FOUND");
                return;
            }
            Err(e) => {
                error!(error = %e, "Database error fetching secret");
                self.send_error(res, 500, "Database error", "DATABASE_ERROR");
                return;
            }
        };

        // Check if already burned
        if secret.is_burned {
            self.send_error(res, 410, "This secret has been burned", "SECRET_BURNED");
            return;
        }

        // Check if max views reached
        if secret.view_count >= secret.max_views {
            self.send_error(res, 410, "This secret has reached maximum views", "MAX_VIEWS_REACHED");
            return;
        }

        // Verify passphrase if required
        if let Some(ref stored_hash) = secret.passphrase_hash {
            let provided_passphrase = view_req.as_ref().and_then(|r| r.passphrase.as_ref());

            match provided_passphrase {
                Some(p) if Crypto::verify_passphrase(p, stored_hash) => {
                    // Passphrase correct, continue
                }
                Some(_) => {
                    warn!(secret_id = %id, "Invalid passphrase attempt");
                    self.send_error(res, 403, "Invalid passphrase", "INVALID_PASSPHRASE");
                    return;
                }
                None => {
                    self.send_error(res, 403, "Passphrase required", "PASSPHRASE_REQUIRED");
                    return;
                }
            }
        }

        // Decrypt the content
        let decrypted = match self.crypto.decrypt(&secret.encrypted_content, &secret.nonce) {
            Ok(d) => d,
            Err(e) => {
                error!(error = %e, secret_id = %id, "Decryption failed");
                self.send_error(res, 500, "Decryption failed", "DECRYPTION_FAILED");
                return;
            }
        };

        let content = match String::from_utf8(decrypted) {
            Ok(c) => c,
            Err(_) => {
                error!(secret_id = %id, "Invalid UTF-8 in decrypted content");
                self.send_error(res, 500, "Invalid content encoding", "INVALID_CONTENT");
                return;
            }
        };

        // Update view count
        let new_view_count = secret.view_count + 1;
        let should_burn = secret.burn_after_reading && new_view_count >= secret.max_views;

        let update_result = diesel::update(secrets::table.filter(secrets::id.eq(id)))
            .set((
                secrets::view_count.eq(new_view_count),
                secrets::is_burned.eq(should_burn),
            ))
            .execute(&mut conn);

        if let Err(e) = update_result {
            error!(error = %e, secret_id = %id, "Failed to update view count");
        }

        // If burn after reading, delete the secret
        if should_burn {
            let _ = diesel::delete(secrets::table.filter(secrets::id.eq(id))).execute(&mut conn);
            info!(secret_id = %id, "Secret burned after viewing");
        }

        self.stats.secrets_viewed.fetch_add(1, Ordering::Relaxed);

        let response = ViewSecretResponse {
            content,
            is_burned: should_burn,
            views_remaining: secret.max_views - new_view_count,
        };

        res.status_code(200, "OK");
        let body = serde_json::to_string(&response).unwrap();
        res.body_vec(body.into_bytes());
    }

    fn handle_burn_secret(&self, id: &str, res: &mut Response) {
        // Validate UUID format
        if Uuid::parse_str(id).is_err() {
            self.send_error(res, 404, "Secret not found", "SECRET_NOT_FOUND");
            return;
        }

        let mut conn = get_connection(&self.pool);

        match diesel::delete(secrets::table.filter(secrets::id.eq(id))).execute(&mut conn) {
            Ok(rows) if rows > 0 => {
                info!(secret_id = %id, "Secret manually burned");
                res.status_code(200, "OK");
                res.body_vec(br#"{"success":true,"message":"Secret has been burned"}"#.to_vec());
            }
            Ok(_) => {
                self.send_error(res, 404, "Secret not found", "SECRET_NOT_FOUND");
            }
            Err(e) => {
                error!(error = %e, secret_id = %id, "Database error burning secret");
                self.send_error(res, 500, "Database error", "DATABASE_ERROR");
            }
        }
    }

    fn send_error(&self, res: &mut Response, status: usize, message: &str, code: &str) {
        let status_text = match status {
            400 => "Bad Request",
            403 => "Forbidden",
            404 => "Not Found",
            410 => "Gone",
            429 => "Too Many Requests",
            500 => "Internal Server Error",
            _ => "Error",
        };

        res.status_code(status, status_text);
        let error = ErrorResponse {
            error: message.to_string(),
            code: code.to_string(),
        };
        let body = serde_json::to_string(&error).unwrap();
        res.body_vec(body.into_bytes());
    }
}

fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("onetimemessage_backend=info".parse().unwrap())
                .add_directive("may_minihttp=warn".parse().unwrap()),
        )
        .with_target(false)
        .with_thread_ids(false)
        .json()
        .init();

    dotenvy::dotenv().ok();

    let host = env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());
    let frontend_url =
        env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());

    let encryption_key = env::var("ENCRYPTION_KEY").unwrap_or_else(|_| {
        eprintln!("WARNING: ENCRYPTION_KEY not set, generating a random key.");
        eprintln!("For production, set ENCRYPTION_KEY environment variable.");
        let key = Crypto::generate_master_key().expect("Failed to generate key");
        eprintln!("Generated key: {}", key);
        key
    });

    let crypto = Crypto::new(&encryption_key).expect("Failed to initialize encryption");
    let pool = establish_connection_pool();
    let rate_limiter = Arc::new(RateLimiter::new());

    // Spawn background thread for rate limiter cleanup
    {
        let rate_limiter_clone = Arc::clone(&rate_limiter);
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_secs(60));
                rate_limiter_clone.cleanup();
            }
        });
    }

    let app_state = AppState {
        pool: Arc::new(pool),
        crypto: Arc::new(crypto),
        rate_limiter,
        stats: Arc::new(Stats::new()),
        frontend_url,
    };

    let addr = format!("{}:{}", host, port);

    info!(
        version = VERSION,
        addr = %addr,
        encryption = "AES-256-GCM",
        framework = "may_minihttp",
        "Starting OneTimeMessage API server"
    );

    println!();
    println!("  ╔══════════════════════════════════════════════════════════╗");
    println!("  ║           OneTimeMessage API Server v{}              ║", VERSION);
    println!("  ╠══════════════════════════════════════════════════════════╣");
    println!("  ║  Encryption: AES-256-GCM (Military Grade)                ║");
    println!("  ║  Framework:  may_minihttp (High Performance)             ║");
    println!("  ║  Database:   MySQL with Diesel ORM                       ║");
    println!("  ╠══════════════════════════════════════════════════════════╣");
    println!("  ║  Endpoints:                                              ║");
    println!("  ║    GET  /health          - Health check                  ║");
    println!("  ║    GET  /docs            - Swagger UI                    ║");
    println!("  ║    GET  /api/docs        - OpenAPI spec                  ║");
    println!("  ║    GET  /api/stats       - Server statistics             ║");
    println!("  ║    POST /api/secrets     - Create secret                 ║");
    println!("  ║    GET  /api/secrets/:id/metadata - Get metadata         ║");
    println!("  ║    POST /api/secrets/:id - View secret                   ║");
    println!("  ║    DEL  /api/secrets/:id - Burn secret                   ║");
    println!("  ╠══════════════════════════════════════════════════════════╣");
    println!("  ║  Server listening on: {}                      ║", addr);
    println!("  ╚══════════════════════════════════════════════════════════╝");
    println!();

    let server = HttpServer(app_state)
        .start(&addr)
        .expect("Failed to start server");
    server.join().expect("Server crashed");
}
