CREATE TABLE secrets (
    id VARCHAR(36) PRIMARY KEY,
    encrypted_content MEDIUMBLOB NOT NULL,
    nonce VARCHAR(32) NOT NULL,
    passphrase_hash VARCHAR(128),
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    view_count INT NOT NULL DEFAULT 0,
    max_views INT NOT NULL DEFAULT 1,
    is_burned BOOLEAN NOT NULL DEFAULT FALSE,
    burn_after_reading BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_secrets_expires_at ON secrets(expires_at);
CREATE INDEX idx_secrets_is_burned ON secrets(is_burned);
