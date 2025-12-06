package api

type CreateMessageRequest struct {
	Msg        string `json:"msg" validate:"required"`
	Expiration uint   `json:"expiration" validate:"required,min=60"` // Min 1 minute
	// Password is no longer needed for creation as we generate a key pair
}

type CreateMessageResponse struct {
	PublicID   string `json:"public_id"`
	PrivateKey string `json:"private_key"`
}

type GetMessageRequest struct {
	PublicID   string `json:"public_id" validate:"required"`
	PrivateKey string `json:"private_key" validate:"required"`
}

type GetMessageResponse struct {
	Msg string `json:"msg"`
}
