package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/nikola43/onetimemessage/models"
	"github.com/nikola43/onetimemessage/services"
	u "github.com/nikola43/onetimemessage/utils"
)

func CreateMessage(c *fiber.Ctx) error {
	request := new(models.CreateMessageRequest)

	err := u.ParseAndValidate(c, request)
	if err != nil {
		return u.ReturnErrorResponse(fiber.StatusBadRequest, err, c)
	}

	response, err := services.CreateMessage(request)
	if err != nil {
		return u.ReturnErrorResponse(fiber.StatusNotFound, err, c)
	}

	return c.JSON(response)
}

func GetMessage(c *fiber.Ctx) error {
	request := new(models.GetMessageRequest)

	err := u.ParseAndValidate(c, request)
	if err != nil {
		return u.ReturnErrorResponse(fiber.StatusBadRequest, err, c)
	}

	response, err := services.GetMessage(request)
	if err != nil {
		return u.ReturnErrorResponse(fiber.StatusNotFound, err, c)
	}

	return c.JSON(response)
}

func DeleteMessage(c *fiber.Ctx) error {
	request := new(models.DeleteMessageRequest)

	err := u.ParseAndValidate(c, request)
	if err != nil {
		return u.ReturnErrorResponse(fiber.StatusBadRequest, err, c)
	}

	err = services.DeleteMessage(request.PublicId)
	if err != nil {
		return u.ReturnErrorResponse(fiber.StatusNotFound, err, c)
	}

	return u.ReturnSuccessResponse(c)
}
