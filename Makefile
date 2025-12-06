.PHONY: backend frontend dev

backend:
	cd backend && go run main.go

frontend:
	cd frontend && npm run dev

dev:
	make -j 2 backend frontend

build-backend:
	cd backend && go build -o bin/server main.go

build-frontend:
	cd frontend && npm run build
