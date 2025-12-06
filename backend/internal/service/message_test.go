package service

import (
	"context"
	"testing"
	"time"

	"github.com/nikola43/onetimemessage/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRepository is a mock implementation of domain.MessageRepository
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) Create(ctx context.Context, msg *domain.Message) error {
	args := m.Called(ctx, msg)
	return args.Error(0)
}

func (m *MockRepository) GetByPublicID(ctx context.Context, publicID string) (*domain.Message, error) {
	args := m.Called(ctx, publicID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Message), args.Error(1)
}

func (m *MockRepository) Delete(ctx context.Context, msg *domain.Message) error {
	args := m.Called(ctx, msg)
	return args.Error(0)
}

func (m *MockRepository) DeleteExpired(ctx context.Context, currentTime uint) error {
	args := m.Called(ctx, currentTime)
	return args.Error(0)
}

func TestCreateMessage(t *testing.T) {
	mockRepo := new(MockRepository)
	service := NewMessageService(mockRepo)
	ctx := context.Background()

	mockRepo.On("Create", ctx, mock.AnythingOfType("*domain.Message")).Return(nil)

	publicID, privateKey, err := service.Create(ctx, "secret message", 3600, "")

	assert.NoError(t, err)
	assert.NotEmpty(t, publicID)
	assert.NotEmpty(t, privateKey)
	mockRepo.AssertExpectations(t)
}

func TestGetMessage_Success(t *testing.T) {
	mockRepo := new(MockRepository)
	service := NewMessageService(mockRepo)
	ctx := context.Background()

	// 1. Create a real message to get valid encrypted data
	// realService := NewMessageService(mockRepo) // Unused
	// We need to mock Create for the setup, but we can't easily get the encrypted data without running the real logic.
	// So let's just manually create a valid encrypted message state.

	// Actually, let's use the real service to generate a valid message first,
	// but we need to mock the repo call inside it.
	mockRepo.On("Create", ctx, mock.Anything).Return(nil)
	_, privKey, _ := service.Create(ctx, "test content", 3600, "")

	// Capture the message passed to Create
	call := mockRepo.Calls[0]
	createdMsg := call.Arguments.Get(1).(*domain.Message)

	// Now setup the Get expectation
	mockRepo.On("GetByPublicID", ctx, createdMsg.PublicId).Return(createdMsg, nil)
	mockRepo.On("Delete", ctx, createdMsg).Return(nil)

	// Test Get
	content, err := service.Get(ctx, createdMsg.PublicId, privKey)

	assert.NoError(t, err)
	assert.Equal(t, "test content", content)
	mockRepo.AssertExpectations(t)
}

func TestGetMessage_Expired(t *testing.T) {
	mockRepo := new(MockRepository)
	service := NewMessageService(mockRepo)
	ctx := context.Background()

	expiredMsg := &domain.Message{
		PublicId:   "expired",
		Expiration: 60,
		CreatedAt:  uint(time.Now().Unix()) - 100, // Expired
	}

	mockRepo.On("GetByPublicID", ctx, "expired").Return(expiredMsg, nil)
	mockRepo.On("Delete", ctx, expiredMsg).Return(nil)

	content, err := service.Get(ctx, "expired", "key")

	assert.Error(t, err)
	assert.Equal(t, "message expired", err.Error())
	assert.Empty(t, content)
	mockRepo.AssertExpectations(t)
}
