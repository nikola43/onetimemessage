package worker

import (
	"context"
	"time"

	"github.com/nikola43/onetimemessage/internal/domain"
	"github.com/rs/zerolog"
)

type Cleaner struct {
	repo   domain.MessageRepository
	logger zerolog.Logger
}

func NewCleaner(repo domain.MessageRepository, logger zerolog.Logger) *Cleaner {
	return &Cleaner{
		repo:   repo,
		logger: logger,
	}
}

func (c *Cleaner) Start(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			c.clean()
		}
	}()
}

func (c *Cleaner) clean() {
	now := uint(time.Now().Unix())
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := c.repo.DeleteExpired(ctx, now); err != nil {
		c.logger.Error().Err(err).Msg("Failed to clean expired messages")
	}
}
