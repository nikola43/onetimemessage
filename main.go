package main

import (
	"fmt"
	"log"
	"os"
	"runtime"
	"strconv"

	"github.com/fatih/color"
	"github.com/joho/godotenv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	jwtlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/nikola43/onetimemessage/controllers"
	db "github.com/nikola43/onetimemessage/database"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var httpServer *fiber.App

func main() {
	// load .env file
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	MYSQL_HOST := os.Getenv("MYSQL_HOST")
	MYSQL_USER := os.Getenv("MYSQL_USER")
	MYSQL_PASSWORD := os.Getenv("MYSQL_PASSWORD")
	MYSQL_DATABASE := os.Getenv("MYSQL_DATABASE")
	MYSQL_PORT := os.Getenv("MYSQL_PORT")

	// system config
	numCpu := runtime.NumCPU()
	usedCpu := numCpu
	runtime.GOMAXPROCS(usedCpu)
	fmt.Println("")
	fmt.Println(color.YellowString("  ----------------- System Info -----------------"))
	fmt.Println(color.CyanString("\t    Number CPU cores available: "), color.GreenString(strconv.Itoa(numCpu)))
	fmt.Println(color.MagentaString("\t    Used of CPU cores: "), color.YellowString(strconv.Itoa(usedCpu)))
	fmt.Println(color.MagentaString(""))

	// Initialize the database
	InitializeDatabase(MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PORT)
	//db.Migrate()
	InitializeHttpServer()
}

func InitializeHttpServer() {

	httpServer = fiber.New(fiber.Config{
		BodyLimit: 2000 * 1024 * 1024, // this is the default limit of 4MB
	})
	/*
		//httpServer.Use(middlewares.XApiKeyMiddleware)
		httpServer.Use(cors.New(cors.Config{
			AllowOrigins: "https://panel.ecox.stelast.com",
		}))
	*/

	httpServer.Use(jwtlogger.New())
	httpServer.Use(cors.New(cors.Config{}))

	HandleRoutes(httpServer)

	httpServer.Listen(":3000")

}

func InitializeDatabase(user, password, dbName, host, port string) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", user, password, host, port, dbName)

	var err error
	db.GormDB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Info)})
	//db.GormDB, err = gorm.Open(mysql.New(mysql.Config{Conn: DB}), &gorm.Config{Logger: logger.Default.LogMode(logger.Info)})
	if err != nil {
		log.Fatal(err)
	}
}

func HandleRoutes(router fiber.Router) {
	api := router.Group("/api")
	api.Post("/message", controllers.CreateMessage)
	api.Post("/message/fetch", controllers.GetMessage)
	api.Delete("/message", controllers.DeleteMessage)
}
