package random

import (
	"crypto/rand"
	"math/big"
)

// GenerateRandomString generates a cryptographically secure random string of the given length.
// It uses the character set: a-z, A-Z, 0-9.
func GenerateString(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		b[i] = charset[num.Int64()]
	}
	return string(b), nil
}
