# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o server main.go

# Final stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server .
COPY backend/.env .
# Expose port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:3001/health || exit 1

# Run the binary
CMD ["./server"]
