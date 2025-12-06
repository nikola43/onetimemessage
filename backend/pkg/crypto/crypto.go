package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"io"
)

// Encrypt encrypts plaintext using AES-GCM with the given key.
// Key must be 32 bytes for AES-256.
func Encrypt(key, plaintext []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts ciphertext using AES-GCM with the given key.
func Decrypt(key []byte, ciphertext string) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	decodedCiphertext, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return nil, err
	}

	if len(decodedCiphertext) < gcm.NonceSize() {
		return nil, io.ErrUnexpectedEOF
	}

	nonce := decodedCiphertext[:gcm.NonceSize()]
	plaintext, err := gcm.Open(nil, nonce, decodedCiphertext[gcm.NonceSize():], nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

// HashString returns the SHA256 hash of the input string as a hex string.
func HashString(input string) string {
	hash := sha256.New()
	hash.Write([]byte(input))
	return hex.EncodeToString(hash.Sum(nil))
}

// GenerateRSAKeyPair generates an RSA key pair of the given bit size.
func GenerateRSAKeyPair(bits int) (string, string, error) {
	privKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return "", "", err
	}

	// Encode Private Key to PEM
	privBytes := x509.MarshalPKCS1PrivateKey(privKey)
	privPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: privBytes,
	})

	// Encode Public Key to PEM
	pubBytes, err := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
	if err != nil {
		return "", "", err
	}
	pubPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubBytes,
	})

	return string(privPEM), string(pubPEM), nil
}

// EncryptRSA encrypts data with an RSA public key (PEM format).
func EncryptRSA(pubPEM string, data []byte) (string, error) {
	block, _ := pem.Decode([]byte(pubPEM))
	if block == nil {
		return "", errors.New("failed to parse PEM block containing the public key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return "", err
	}

	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return "", errors.New("key is not of type *rsa.PublicKey")
	}

	// OAEP encryption
	ciphertext, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, rsaPub, data, nil)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptRSA decrypts data with an RSA private key (PEM format).
func DecryptRSA(privPEM string, ciphertextBase64 string) ([]byte, error) {
	block, _ := pem.Decode([]byte(privPEM))
	if block == nil {
		return nil, errors.New("failed to parse PEM block containing the private key")
	}

	priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	ciphertext, err := base64.StdEncoding.DecodeString(ciphertextBase64)
	if err != nil {
		return nil, err
	}

	// OAEP decryption
	plaintext, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, priv, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}
