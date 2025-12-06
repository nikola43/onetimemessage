package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
)

func New(env string) zerolog.Logger {
	var output zerolog.ConsoleWriter

	if env == "development" {
		output = zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	} else {
		// JSON output for production
		return zerolog.New(os.Stdout).With().Timestamp().Logger()
	}

	return zerolog.New(output).With().Timestamp().Logger()
}
