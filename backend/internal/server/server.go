package server

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/nikola43/onetimemessage/internal/api"
	"github.com/nikola43/onetimemessage/internal/config"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

type Server struct {
	App    *fiber.App
	Config *config.Config
}

func New(cfg *config.Config, handler *api.MessageHandler) *Server {
	app := fiber.New(fiber.Config{
		AppName: "One Time Message",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(helmet.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.FrontendURL,
		AllowHeaders: "Origin, Content-Type, Accept",
	}))
	app.Use(limiter.New(limiter.Config{
		Max:        20,
		Expiration: 1 * time.Minute,
	}))

	// Routes
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	apiGroup := app.Group("/api")
	apiGroup.Post("/message", handler.Create)
	apiGroup.Post("/message/fetch", handler.Get)

	return &Server{
		App:    app,
		Config: cfg,
	}
}

func (s *Server) Listen() error {
	return s.App.Listen(":" + s.Config.AppPort)
}

func (s *Server) Shutdown() error {
	return s.App.Shutdown()
}
