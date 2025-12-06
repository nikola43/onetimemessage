package repository

import (
	"context"

	"github.com/nikola43/onetimemessage/internal/domain"
	"gorm.io/gorm"
)

type messageRepository struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) domain.MessageRepository {
	return &messageRepository{db: db}
}

func (r *messageRepository) Create(ctx context.Context, msg *domain.Message) error {
	return r.db.WithContext(ctx).Create(msg).Error
}

func (r *messageRepository) GetByPublicID(ctx context.Context, publicID string) (*domain.Message, error) {
	var msg domain.Message
	err := r.db.WithContext(ctx).Where("public_id = ?", publicID).First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *messageRepository) Delete(ctx context.Context, msg *domain.Message) error {
	return r.db.WithContext(ctx).Unscoped().Delete(msg).Error
}

func (r *messageRepository) DeleteExpired(ctx context.Context, currentTime uint) error {
	return r.db.WithContext(ctx).Unscoped().Where("created_at + expiration < ?", currentTime).Delete(&domain.Message{}).Error
}
