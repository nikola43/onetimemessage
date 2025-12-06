package config

import (
	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	AppPort string `env:"APP_PORT" envDefault:"3001"`
	AppEnv  string `env:"APP_ENV" envDefault:"development"`

	DBUser     string `env:"MYSQL_USER"`
	DBPassword string `env:"MYSQL_PASSWORD"`
	DBHost     string `env:"MYSQL_HOST"`
	DBPort     string `env:"MYSQL_PORT"`
	DBName     string `env:"MYSQL_DATABASE"`

	FrontendURL string `env:"APP_FRONTEND_URL" envDefault:"http://localhost:5173"`
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
