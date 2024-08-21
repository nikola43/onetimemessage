package utils

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

func ReturnErrorResponse(status int, err error, c *fiber.Ctx) error {
	return c.Status(status).JSON(&fiber.Map{
		"error": err.Error(),
	})
}

func ReturnSuccessResponse(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(&fiber.Map{
		"success": true,
	})
}

func ParseAndValidate(c *fiber.Ctx, o interface{}) error {
	err := c.BodyParser(o)
	if err != nil {
		return err
	}

	v := validator.New()
	err = v.Struct(o)
	if err != nil {
		for _, e := range err.(validator.ValidationErrors) {
			if e != nil {
				return e
			}
		}
	}

	return nil
}
