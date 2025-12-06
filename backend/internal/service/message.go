package service

import (
	"context"
	"errors"
	"time"

	"github.com/nikola43/onetimemessage/internal/domain"
	"github.com/nikola43/onetimemessage/pkg/crypto"
	"github.com/nikola43/onetimemessage/pkg/random"
)

type messageService struct {
	repo domain.MessageRepository
}

func NewMessageService(repo domain.MessageRepository) domain.MessageService {
	return &messageService{repo: repo}
}

func (s *messageService) Create(ctx context.Context, msgContent string, expiration uint, password string) (string, string, error) {
	// 1. Generate AES Key (32 bytes)
	aesKey, err := random.GenerateString(32)
	if err != nil {
		return "", "", err
	}

	// 2. Encrypt Content with AES Key
	encryptedMsg, err := crypto.Encrypt([]byte(aesKey), []byte(msgContent))
	if err != nil {
		return "", "", err
	}

	// 3. Generate RSA-8192 Key Pair
	privPEM, pubPEM, err := crypto.GenerateRSAKeyPair(8192)
	if err != nil {
		return "", "", err
	}

	// 4. Encrypt AES Key with RSA Public Key
	encryptedAESKey, err := crypto.EncryptRSA(pubPEM, []byte(aesKey))
	if err != nil {
		return "", "", err
	}

	// 5. Generate IDs
	publicId, err := random.GenerateString(32)
	if err != nil {
		return "", "", err
	}
	privateId, err := random.GenerateString(32)
	if err != nil {
		return "", "", err
	}

	msg := &domain.Message{
		Msg:             encryptedMsg,
		Expiration:      expiration,
		PublicId:        publicId,
		PrivateId:       privateId,
		IsEncrypted:     true,
		EncryptedAESKey: encryptedAESKey,
		CreatedAt:       uint(time.Now().Unix()),
	}

	if err := s.repo.Create(ctx, msg); err != nil {
		return "", "", err
	}

	// Return PublicID and Private Key (PEM)
	return msg.PublicId, privPEM, nil
}

func (s *messageService) Get(ctx context.Context, publicID string, privateKeyPEM string) (string, error) {
	msg, err := s.repo.GetByPublicID(ctx, publicID)
	if err != nil {
		return "", err
	}

	// Check expiration
	if uint(time.Now().Unix()) > msg.CreatedAt+msg.Expiration {
		s.repo.Delete(ctx, msg)
		return "", errors.New("message expired")
	}

	content := msg.Msg
	if msg.IsEncrypted {
		if privateKeyPEM == "" {
			return "", errors.New("private key required")
		}

		// 1. Decrypt AES Key using RSA Private Key
		aesKeyBytes, err := crypto.DecryptRSA(privateKeyPEM, msg.EncryptedAESKey)
		if err != nil {
			return "", errors.New("invalid private key")
		}

		// 2. Decrypt Content using AES Key
		decrypted, err := crypto.Decrypt(aesKeyBytes, content)
		if err != nil {
			return "", errors.New("failed to decrypt message")
		}
		content = string(decrypted)
	}

	// Delete after read
	s.repo.Delete(ctx, msg)

	return content, nil
}
