package database

import (
	"github.com/nikola43/onetimemessage/models"
	"gorm.io/gorm"
)

var GormDB *gorm.DB

func Migrate() {
	// DROP
	GormDB.Migrator().DropTable(&models.Message{})

	// CREATE
	GormDB.AutoMigrate(&models.Message{})
}
