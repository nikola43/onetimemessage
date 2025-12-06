package api

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/nikola43/onetimemessage/internal/domain"
)

type MessageHandler struct {
	service   domain.MessageService
	validator *validator.Validate
}

func NewMessageHandler(service domain.MessageService) *MessageHandler {
	return &MessageHandler{
		service:   service,
		validator: validator.New(),
	}
}

func (h *MessageHandler) Create(c *fiber.Ctx) error {
	var req CreateMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	publicID, privateKey, err := h.service.Create(c.Context(), req.Msg, req.Expiration, "")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create message"})
	}

	return c.Status(fiber.StatusCreated).JSON(CreateMessageResponse{
		PublicID:   publicID,
		PrivateKey: privateKey,
	})
}

func (h *MessageHandler) Get(c *fiber.Ctx) error {
	var req GetMessageRequest
	// Allow getting params from body or query/params?
	// Usually GET requests don't have body.
	// But for "Password", we might want to send it in body to avoid logging it in URL.
	// So POST /api/message/fetch is better.
	// The original API was POST /api/message/fetch.

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// If PublicID is not in body, maybe check param?
	// But let's stick to body for now as per original design.

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	msg, err := h.service.Get(c.Context(), req.PublicID, req.PrivateKey)
	if err != nil {
		// Differentiate between "not found", "expired", "invalid password"
		// For security, maybe just return 404 or 400?
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(GetMessageResponse{
		Msg: msg,
	})
}
