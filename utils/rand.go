package utils

import (
	"math/rand"
	"time"
)

func GenerateRandomString(length int) string {
	// Define the character set to use for generating the string
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	// Seed the random number generator to get different results each time
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Create a slice to hold the generated characters
	randomString := make([]byte, length)

	// Generate the random string
	for i := range randomString {
		randomString[i] = charset[seededRand.Intn(len(charset))]
	}

	return string(randomString)
}

func GenerateRandomId() string {
	s := GenerateRandomString(256)
	return HashString(s)[:32]
}
