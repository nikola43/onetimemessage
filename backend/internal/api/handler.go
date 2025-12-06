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

// Create godoc
// @Summary Create a new one-time message
// @Description Create a message with expiration and optional password protection. Returns a Public ID and a Private Key.
// @Tags message
// @Accept json
// @Produce json
// @Param request body CreateMessageRequest true "Message Creation Request"
// @Success 201 {object} CreateMessageResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/message [post]
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

// Get godoc
// @Summary Retrieve a one-time message
// @Description Retrieve and decrypt a message using its Public ID and Private Key. The message is deleted after retrieval.
// @Tags message
// @Accept json
// @Produce json
// @Param request body GetMessageRequest true "Message Retrieval Request"
// @Success 200 {object} GetMessageResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/message/fetch [post]
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
