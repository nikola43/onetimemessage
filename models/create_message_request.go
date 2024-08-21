package models

type CreateMessageRequest struct {
	Msg        string `json:"msg"`
	Expiration uint   `json:"expiration"`
	Encrypt    bool   `json:"encrypt"`
}
