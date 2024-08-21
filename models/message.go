package models

import "time"

type Message struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	Msg        string    `gorm:"type:longtext not null" json:"msg" xml:"msg" form:"msg"`
	Expiration uint      `gorm:"type:int not null" json:"expiration" xml:"expiration" form:"expiration"`
	PublicId   string    `gorm:"index; type:varchar(32) not null; size:32" json:"public_id" xml:"public_id" form:"public_id"`
	PrivateId  string    `gorm:"index; type:varchar(32) not null; size:32" json:"private_id" xml:"private_id" form:"private_id"`
	CreatedAt  time.Time `json:"created_at"`
}
