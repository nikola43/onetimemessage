package models

type GetMessageRequest struct {
	PublicId  string `json:"public_id"`
	Key string `json:"key"`
}
