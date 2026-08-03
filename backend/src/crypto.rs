//! Military-grade encryption module using AES-256-GCM
//!
//! AES-256-GCM provides:
//! - 256-bit encryption key (military/government standard)
//! - Authenticated encryption (AEAD)
//! - Protection against tampering
//! - Unique nonce per encryption operation

use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};
use ring::rand::{SecureRandom, SystemRandom};
use ring::pbkdf2;
use std::num::NonZeroU32;

const CREDENTIAL_LEN: usize = 32; // 256 bits for AES-256
const NONCE_LEN: usize = 12; // 96 bits for GCM nonce
const PBKDF2_ITERATIONS: u32 = 100_000; // High iteration count for security

pub struct Crypto {
    key: Vec<u8>,
    rng: SystemRandom,
}

impl Crypto {
    /// Create a new Crypto instance with the provided master key (hex-encoded)
    pub fn new(master_key_hex: &str) -> Result<Self, CryptoError> {
        let key = hex::decode(master_key_hex)
            .map_err(|_| CryptoError::InvalidKey)?;

        if key.len() != CREDENTIAL_LEN {
            return Err(CryptoError::InvalidKeyLength);
        }

        Ok(Self {
            key,
            rng: SystemRandom::new(),
        })
    }

    /// Generate a new random 256-bit master key (hex-encoded)
    pub fn generate_master_key() -> Result<String, CryptoError> {
        let rng = SystemRandom::new();
        let mut key = vec![0u8; CREDENTIAL_LEN];
        rng.fill(&mut key)
            .map_err(|_| CryptoError::RandomGenerationFailed)?;
        Ok(hex::encode(key))
    }

    /// Encrypt plaintext using AES-256-GCM
    /// Returns (ciphertext, nonce_hex)
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<(Vec<u8>, String), CryptoError> {
        // Generate random nonce
        let mut nonce_bytes = [0u8; NONCE_LEN];
        self.rng.fill(&mut nonce_bytes)
            .map_err(|_| CryptoError::RandomGenerationFailed)?;

        // Create the encryption key
        let unbound_key = UnboundKey::new(&AES_256_GCM, &self.key)
            .map_err(|_| CryptoError::KeyCreationFailed)?;
        let key = LessSafeKey::new(unbound_key);

        // Prepare the data for in-place encryption
        let mut in_out = plaintext.to_vec();

        // Encrypt in place (appends the authentication tag)
        let nonce = Nonce::assume_unique_for_key(nonce_bytes);
        key.seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)
            .map_err(|_| CryptoError::EncryptionFailed)?;

        Ok((in_out, hex::encode(nonce_bytes)))
    }

    /// Decrypt ciphertext using AES-256-GCM
    pub fn decrypt(&self, ciphertext: &[u8], nonce_hex: &str) -> Result<Vec<u8>, CryptoError> {
        // Decode nonce
        let nonce_bytes: [u8; NONCE_LEN] = hex::decode(nonce_hex)
            .map_err(|_| CryptoError::InvalidNonce)?
            .try_into()
            .map_err(|_| CryptoError::InvalidNonce)?;

        // Create the decryption key
        let unbound_key = UnboundKey::new(&AES_256_GCM, &self.key)
            .map_err(|_| CryptoError::KeyCreationFailed)?;
        let key = LessSafeKey::new(unbound_key);

        // Prepare the data for in-place decryption
        let mut in_out = ciphertext.to_vec();

        // Decrypt in place (removes and verifies the authentication tag)
        let nonce = Nonce::assume_unique_for_key(nonce_bytes);
        let plaintext = key.open_in_place(nonce, Aad::empty(), &mut in_out)
            .map_err(|_| CryptoError::DecryptionFailed)?;

        Ok(plaintext.to_vec())
    }

    /// Hash a passphrase using PBKDF2-HMAC-SHA256
    pub fn hash_passphrase(passphrase: &str) -> String {
        let rng = SystemRandom::new();
        let mut salt = [0u8; 16];
        rng.fill(&mut salt).expect("Failed to generate salt");

        let mut hash = [0u8; CREDENTIAL_LEN];
        pbkdf2::derive(
            pbkdf2::PBKDF2_HMAC_SHA256,
            NonZeroU32::new(PBKDF2_ITERATIONS).unwrap(),
            &salt,
            passphrase.as_bytes(),
            &mut hash,
        );

        // Return salt:hash format (both hex-encoded)
        format!("{}:{}", hex::encode(salt), hex::encode(hash))
    }

    /// Verify a passphrase against a stored hash
    pub fn verify_passphrase(passphrase: &str, stored_hash: &str) -> bool {
        let parts: Vec<&str> = stored_hash.split(':').collect();
        if parts.len() != 2 {
            return false;
        }

        let salt = match hex::decode(parts[0]) {
            Ok(s) => s,
            Err(_) => return false,
        };

        let expected_hash = match hex::decode(parts[1]) {
            Ok(h) => h,
            Err(_) => return false,
        };

        // Use pbkdf2::verify for constant-time comparison
        pbkdf2::verify(
            pbkdf2::PBKDF2_HMAC_SHA256,
            NonZeroU32::new(PBKDF2_ITERATIONS).unwrap(),
            &salt,
            passphrase.as_bytes(),
            &expected_hash,
        ).is_ok()
    }
}

#[derive(Debug)]
pub enum CryptoError {
    InvalidKey,
    InvalidKeyLength,
    InvalidNonce,
    KeyCreationFailed,
    EncryptionFailed,
    DecryptionFailed,
    RandomGenerationFailed,
}

impl std::fmt::Display for CryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CryptoError::InvalidKey => write!(f, "Invalid encryption key"),
            CryptoError::InvalidKeyLength => write!(f, "Key must be 32 bytes (64 hex chars)"),
            CryptoError::InvalidNonce => write!(f, "Invalid nonce"),
            CryptoError::KeyCreationFailed => write!(f, "Failed to create encryption key"),
            CryptoError::EncryptionFailed => write!(f, "Encryption failed"),
            CryptoError::DecryptionFailed => write!(f, "Decryption failed - data may be corrupted"),
            CryptoError::RandomGenerationFailed => write!(f, "Failed to generate random data"),
        }
    }
}

impl std::error::Error for CryptoError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let key = Crypto::generate_master_key().unwrap();
        let crypto = Crypto::new(&key).unwrap();

        let plaintext = b"Hello, World! This is a secret message.";
        let (ciphertext, nonce) = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&ciphertext, &nonce).unwrap();

        assert_eq!(plaintext.to_vec(), decrypted);
    }

    #[test]
    fn test_encrypt_decrypt_empty() {
        let key = Crypto::generate_master_key().unwrap();
        let crypto = Crypto::new(&key).unwrap();

        let plaintext = b"";
        let (ciphertext, nonce) = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&ciphertext, &nonce).unwrap();

        assert_eq!(plaintext.to_vec(), decrypted);
    }

    #[test]
    fn test_encrypt_decrypt_large_data() {
        let key = Crypto::generate_master_key().unwrap();
        let crypto = Crypto::new(&key).unwrap();

        // 1MB of data
        let plaintext: Vec<u8> = (0..1024 * 1024).map(|i| (i % 256) as u8).collect();
        let (ciphertext, nonce) = crypto.encrypt(&plaintext).unwrap();
        let decrypted = crypto.decrypt(&ciphertext, &nonce).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_encrypt_decrypt_unicode() {
        let key = Crypto::generate_master_key().unwrap();
        let crypto = Crypto::new(&key).unwrap();

        let plaintext = "Hello 世界 🔐 Привет мир!".as_bytes();
        let (ciphertext, nonce) = crypto.encrypt(plaintext).unwrap();
        let decrypted = crypto.decrypt(&ciphertext, &nonce).unwrap();

        assert_eq!(plaintext.to_vec(), decrypted);
    }

    #[test]
    fn test_different_nonces_for_same_plaintext() {
        let key = Crypto::generate_master_key().unwrap();
        let crypto = Crypto::new(&key).unwrap();

        let plaintext = b"Same message";
        let (ciphertext1, nonce1) = crypto.encrypt(plaintext).unwrap();
        let (ciphertext2, nonce2) = crypto.encrypt(plaintext).unwrap();

        // Nonces should be different
        assert_ne!(nonce1, nonce2);
        // Ciphertexts should be different (due to different nonces)
        assert_ne!(ciphertext1, ciphertext2);
    }

    #[test]
    fn test_decrypt_with_wrong_key_fails() {
        let key1 = Crypto::generate_master_key().unwrap();
        let key2 = Crypto::generate_master_key().unwrap();
        let crypto1 = Crypto::new(&key1).unwrap();
        let crypto2 = Crypto::new(&key2).unwrap();

        let plaintext = b"Secret message";
        let (ciphertext, nonce) = crypto1.encrypt(plaintext).unwrap();

        // Decrypting with wrong key should fail
        let result = crypto2.decrypt(&ciphertext, &nonce);
        assert!(result.is_err());
    }

    #[test]
    fn test_decrypt_with_tampered_ciphertext_fails() {
        let key = Crypto::generate_master_key().unwrap();
        let crypto = Crypto::new(&key).unwrap();

        let plaintext = b"Secret message";
        let (mut ciphertext, nonce) = crypto.encrypt(plaintext).unwrap();

        // Tamper with ciphertext
        if !ciphertext.is_empty() {
            ciphertext[0] ^= 0xFF;
        }

        // Decryption should fail (GCM authentication)
        let result = crypto.decrypt(&ciphertext, &nonce);
        assert!(result.is_err());
    }

    #[test]
    fn test_passphrase_hashing() {
        let passphrase = "my-secret-passphrase";
        let hash = Crypto::hash_passphrase(passphrase);

        assert!(Crypto::verify_passphrase(passphrase, &hash));
        assert!(!Crypto::verify_passphrase("wrong-passphrase", &hash));
    }

    #[test]
    fn test_passphrase_hash_uniqueness() {
        let passphrase = "same-passphrase";
        let hash1 = Crypto::hash_passphrase(passphrase);
        let hash2 = Crypto::hash_passphrase(passphrase);

        // Each hash should be different (due to random salt)
        assert_ne!(hash1, hash2);
        // But both should verify correctly
        assert!(Crypto::verify_passphrase(passphrase, &hash1));
        assert!(Crypto::verify_passphrase(passphrase, &hash2));
    }

    #[test]
    fn test_passphrase_empty() {
        let passphrase = "";
        let hash = Crypto::hash_passphrase(passphrase);
        assert!(Crypto::verify_passphrase(passphrase, &hash));
    }

    #[test]
    fn test_passphrase_unicode() {
        let passphrase = "пароль🔑密码";
        let hash = Crypto::hash_passphrase(passphrase);
        assert!(Crypto::verify_passphrase(passphrase, &hash));
        assert!(!Crypto::verify_passphrase("wrong", &hash));
    }

    #[test]
    fn test_verify_invalid_hash_format() {
        assert!(!Crypto::verify_passphrase("test", "invalid"));
        assert!(!Crypto::verify_passphrase("test", "no:colon:here"));
        assert!(!Crypto::verify_passphrase("test", ":"));
        assert!(!Crypto::verify_passphrase("test", "notahex:alsonotahex"));
    }

    #[test]
    fn test_invalid_key_length() {
        let result = Crypto::new("tooshort");
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_key_hex() {
        let result = Crypto::new("gg00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");
        assert!(result.is_err());
    }

    #[test]
    fn test_generate_master_key_format() {
        let key = Crypto::generate_master_key().unwrap();
        assert_eq!(key.len(), 64); // 32 bytes = 64 hex chars
        assert!(key.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_crypto_error_display() {
        assert!(!CryptoError::InvalidKey.to_string().is_empty());
        assert!(!CryptoError::InvalidKeyLength.to_string().is_empty());
        assert!(!CryptoError::InvalidNonce.to_string().is_empty());
        assert!(!CryptoError::EncryptionFailed.to_string().is_empty());
        assert!(!CryptoError::DecryptionFailed.to_string().is_empty());
    }
}
