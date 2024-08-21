package services

import (
	"fmt"

	db "github.com/nikola43/onetimemessage/database"
	"github.com/nikola43/onetimemessage/models"
	u "github.com/nikola43/onetimemessage/utils"
)

func CreateMessage(request *models.CreateMessageRequest) (*models.CreateMessageResponse, error) {
	message := &models.Message{
		Msg:        request.Msg,
		Expiration: request.Expiration,
		PublicId:   u.GenerateRandomId(),
		PrivateId:  u.GenerateRandomId(),
	}

	key := ""

	if request.Encrypt {
		key = u.HashString(u.GenerateRandomString(256))[:32]
		encryptedMsg, err := u.Encrypt([]byte(key[:32]), []byte(request.Msg))
		if err != nil {
			return nil, err
		}

		message.Msg = encryptedMsg
	}

	r := db.GormDB.Create(message)
	if r.Error != nil {
		return nil, r.Error
	}

	fmt.Println("Message created with ID:", message.ID)
	fmt.Println("key:", key)

	return &models.CreateMessageResponse{
		Key:      key,
		PublicId: message.PublicId,
	}, nil
}

func GetMessage(request *models.GetMessageRequest) (*models.GetMessageResponse, error) {
	// Get the message from the database
	message := &models.Message{}
	result := db.GormDB.First(&message, "public_id = ?", request.PublicId)
	if result.Error != nil {
		return nil, result.Error
	}

	// Decrypt the message if it was encrypted
	if request.Key != "" && message.Msg != "" {
		decryptedMsg, err := u.Decrypt([]byte(request.Key), message.Msg)
		if err != nil {
			return nil, err
		}
		message.Msg = string(decryptedMsg)
	}

	// Delete the message from the database
	db.GormDB.Unscoped().Delete(message)

	response := &models.GetMessageResponse{
		Msg: message.Msg,
	}

	return response, nil
}

func DeleteMessage(id string) error {
	// Get the message from the database
	message := &models.Message{}
	result := db.GormDB.First(&message, "public_id = ?", id)
	if result.Error != nil {
		return result.Error
	}

	// Delete the message from the database
	r := db.GormDB.Unscoped().Delete(message)
	if r.Error != nil {
		return r.Error
	}
	
	return nil
}
