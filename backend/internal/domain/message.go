package domain

import "context"

type Message struct {
	ID              uint   `gorm:"primarykey" json:"id"`
	Msg             string `gorm:"type:longtext not null" json:"msg"`
	Expiration      uint   `gorm:"type:int not null" json:"expiration"`
	PublicId        string `gorm:"index;type:varchar(32);not null" json:"public_id"`
	PrivateId       string `gorm:"index;type:varchar(32);not null" json:"private_id"`
	IsEncrypted     bool   `gorm:"default:false" json:"is_encrypted"`
	EncryptedAESKey string `gorm:"type:longtext" json:"encrypted_aes_key"`
	CreatedAt       uint   `json:"created_at"`
}

type MessageRepository interface {
	Create(ctx context.Context, msg *Message) error
	GetByPublicID(ctx context.Context, publicID string) (*Message, error)
	Delete(ctx context.Context, msg *Message) error
	DeleteExpired(ctx context.Context, currentTime uint) error
}

type MessageService interface {
	Create(ctx context.Context, msg string, expiration uint, password string) (string, string, error)
	Get(ctx context.Context, publicID string, privateKey string) (string, error)
}
